import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/errors'
import { envInt } from '@/lib/env'
import type { Prisma } from '@prisma/client'
import { runTool, TOOL_DEFINITIONS, TOOL_KINDS, describeAction, type ToolName } from './tools'
import type { AIMessage, AIConversation } from '@prisma/client'

const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
const openaiApiKey = process.env.OPENAI_API_KEY?.trim()

// Gemini is served through Google's OpenAI-compatible endpoint so the whole
// agent loop below is provider-agnostic. Gemini wins when both keys are set.
const provider: 'gemini' | 'openai' | null = geminiApiKey
  ? 'gemini'
  : openaiApiKey
    ? 'openai'
    : null

const openai = provider
  ? new OpenAI({
      apiKey: geminiApiKey ?? openaiApiKey!,
      // Fail fast on quota exhaustion — the free tier caps requests per minute,
      // and repeated SDK backoff retries just keep the window full.
      maxRetries: 1,
      ...(provider === 'gemini'
        ? { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' }
        : {}),
    })
  : null

const model =
  provider === 'gemini'
    ? (process.env.GEMINI_MODEL ?? 'gemini-3.5-flash')
    : (process.env.OPENAI_MODEL ?? 'gpt-4o-mini')

// Cost protection. Env-configurable with safe defaults; documented in
// .env.example. Bound the agent loop, cap per-call output tokens, and trim
// conversation history so a single request can never balloon into an
// unbounded number of model calls or tokens.
const maxAgentSteps = envInt('AI_MAX_AGENT_STEPS', 6)
const maxOutputTokens = envInt('AI_MAX_OUTPUT_TOKENS', 2048)
const maxHistoryMessages = envInt('AI_MAX_HISTORY_MESSAGES', 20)

function translateAIError(err: unknown, action: string): never {
  if (err instanceof OpenAI.APIError) {
    if (err instanceof OpenAI.APIConnectionError) {
      throw new ApiError('AI_UNREACHABLE', `Could not reach the AI provider. Check your internet connection and try again.`, 502)
    }
    if (err.status === 429) {
      throw new ApiError('AI_RATE_LIMITED', 'The AI provider is rate-limiting requests. Wait about a minute, then try again.', 429)
    }
    if (err.status === 401) {
      throw new ApiError('AI_AUTH', 'The AI provider rejected the API key. Check GEMINI_API_KEY / OPENAI_API_KEY in your .env.', 401)
    }
    throw new ApiError('AI_ERROR', `${action} failed with the AI provider${err.status ? ` (${err.status})` : ''}. Please try again.`, 502)
  }
  throw err
}

const SYSTEM_PROMPT = `You are VANTA, the AI operating assistant inside a business management app.
You help the user run their freelance or small-business workspace: clients, projects, tasks, invoicing and payments.

Rules:
- Use the provided tools to answer questions about workspace data. Never invent ids, names, numbers or amounts.
- When a user asks you to CREATE, UPDATE, or CHANGE the STATUS of anything (a write action), call the corresponding tool WITHOUT executing it — the system intercepts write tool calls and asks the user to confirm. Do not refuse; just call the tool.
- For read-only questions (listing clients, projects, tasks, invoices, metrics, activity), call the tool and then summarize the results naturally and concisely.
- Money amounts: present them with the correct currency symbol. Do not round in a way that misrepresents totals.
- Keep responses short and practical. Use bullet lists when there is more than one item.
- If you don't have the information you need (e.g. a client id), call a list tool first to find it.`

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type AgentResult =
  | { kind: 'reply'; conversationId: string; content: string }
  | {
      kind: 'needsConfirmation'
      conversationId: string
      toolName: ToolName
      args: Record<string, unknown>
      summary: string
      content: string
    }
  | { kind: 'unconfigured'; conversationId: string; content: string }

function toOpenAIMessages(history: AIMessage[]): ChatMessage[] {
  return history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

function summarizeToolResult(name: string, ok: boolean, text: string): string {
  if (ok) {
    try {
      const parsed = JSON.parse(text)
      return `Tool ${name} succeeded: ${text.slice(0, 500)}`
    } catch {
      return `Tool ${name} result: ${text.slice(0, 500)}`
    }
  }
  return `Tool ${name} failed: ${text.slice(0, 300)}`
}

/**
 * The core agent loop. Runs against OpenAI with the workspace-scoped tool
 * registry. Read tools execute immediately; write tools are intercepted and
 * returned as a confirmation request.
 */
export async function runAgent(input: {
  workspaceId: string
  conversationId?: string | null
  message: string
}): Promise<AgentResult> {
  const { workspaceId, message } = input

  let conversation: AIConversation | null
  if (input.conversationId) {
    conversation = await prisma.aIConversation.findFirst({
      where: { id: input.conversationId, workspaceId },
    })
    if (!conversation) throw new ApiError('NOT_FOUND', 'Conversation not found.', 404)
  } else {
    conversation = await prisma.aIConversation.create({
      data: {
        workspaceId,
        title: message.length > 60 ? `${message.slice(0, 60)}…` : message,
      },
    })
  }

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: 'user', content: message },
  })

  if (!openai) {
    return {
      kind: 'unconfigured',
      conversationId: conversation.id,
      content:
        'The AI assistant is not configured yet. Add a GEMINI_API_KEY or OPENAI_API_KEY to your .env to enable VANTA.',
    }
  }

  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  })

  // Live message array for this invocation (tool results stay in memory).
  // Keep only the most recent N history messages to bound prompt size.
  const live: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...toOpenAIMessages(history).slice(-maxHistoryMessages),
  ]

  let finalContent: string | null = null

  for (let i = 0; i < maxAgentSteps; i++) {
    let completion: OpenAI.Chat.Completions.ChatCompletion
    try {
      completion = await openai.chat.completions.create({
        model,
        messages: live,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.4,
        max_tokens: maxOutputTokens,
      })
    } catch (err) {
      translateAIError(err, 'The request')
    }

    const choice = completion.choices[0]
    const assistantMessage = choice.message
    const content = assistantMessage.content ?? ''

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalContent = content.trim()
      break
    }

    const toolCalls = assistantMessage.tool_calls
    live.push({
      role: 'assistant',
      content: content || '',
      // Preserve provider-specific fields (e.g. Gemini's extra_content thought
      // signature) — stripping them makes the follow-up call fail with 400.
      tool_calls: toolCalls.map((tc) => ({
        ...tc,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    })

    const writeCall = toolCalls.find(
      (tc) => tc.function && TOOL_KINDS[tc.function.name as ToolName] === 'write',
    )

    if (writeCall) {
      const toolName = writeCall.function.name as ToolName
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(writeCall.function.arguments || '{}') as Record<string, unknown>
      } catch {
        args = {}
      }
      const summary = describeAction(toolName, args)
      finalContent = `I can do this for you — ${summary.toLowerCase()}. Want me to go ahead?`
      return {
        kind: 'needsConfirmation',
        conversationId: conversation.id,
        toolName,
        args,
        summary,
        content: finalContent,
      }
    }

    for (const call of toolCalls) {
      const name = call.function.name as ToolName
      let args: unknown
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {
        args = {}
      }
      const result = await runTool(name, { workspaceId }, args)
      live.push({
        role: 'tool',
        tool_call_id: call.id,
        content: summarizeToolResult(name, result.ok, result.text),
      })
    }
  }

  if (finalContent === null) {
    finalContent = 'I could not complete that request within the allowed steps. Please try rephrasing.'
  }

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: 'assistant', content: finalContent },
  })

  return { kind: 'reply', conversationId: conversation.id, content: finalContent }
}

/**
 * Executes a previously-confirmed write action and produces a natural
 * acknowledgment of the outcome.
 */
export async function confirmAction(input: {
  workspaceId: string
  conversationId: string
  toolName: ToolName
  args: Record<string, unknown>
}): Promise<{ conversationId: string; content: string; outcome: string }> {
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: input.conversationId, workspaceId: input.workspaceId },
  })
  if (!conversation) throw new ApiError('NOT_FOUND', 'Conversation not found.', 404)

  const result = await runTool(input.toolName, { workspaceId: input.workspaceId }, input.args)
  if (!result.ok) {
    throw new ApiError('TOOL_ERROR', result.text, 400)
  }

  let outcome = result.text
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'system',
            content: `The user confirmed the action ${input.toolName}. It executed with this result: ${result.text}. Acknowledge the outcome in one or two friendly sentences, including any important identifiers (ids, invoice numbers, totals). Do not ask for more confirmations.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 200,
      })
      outcome = completion.choices[0].message.content?.trim() || result.text
    } catch {
      outcome = result.text
    }
  }

  await prisma.aIMessage.create({
    data: {
      conversationId: input.conversationId,
      role: 'tool',
      content: result.text,
      toolName: input.toolName,
      toolArguments: input.args as Prisma.InputJsonValue,
    },
  })
  await prisma.aIMessage.create({
    data: { conversationId: input.conversationId, role: 'assistant', content: outcome },
  })

  return { conversationId: input.conversationId, content: outcome, outcome: result.text }
}
