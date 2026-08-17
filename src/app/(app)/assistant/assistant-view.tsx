'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Trash2, Plus, Circle, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { api, ApiClientError } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/utils'
import type { Conversation } from '@/lib/types'

type ChatResult =
  | { kind: 'reply'; conversationId: string; content: string }
  | {
      kind: 'needsConfirmation'
      conversationId: string
      toolName: string
      args: Record<string, unknown>
      summary: string
      content: string
    }
  | { kind: 'unconfigured'; conversationId: string; content: string }

interface ChatMsg {
  id: string
  role: string
  content: string
  toolName: string | null
  createdAt: string
}

interface PendingConfirm {
  conversationId: string
  toolName: string
  args: Record<string, unknown>
  summary: string
}

const quickPrompts = [
  'What is my outstanding balance?',
  'Which projects are behind schedule?',
  'List my tasks due soon',
  'Summarize my recent activity',
]

let localId = 0
const nextId = () => `local-${++localId}`

export function AssistantView({
  initialConversations,
  initialConversationTotal,
}: {
  initialConversations: Conversation[]
  initialConversationTotal: number
}) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [conversationPage, setConversationPage] = useState(1)
  const [conversationTotal, setConversationTotal] = useState(initialConversationTotal)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const refreshConversations = useCallback(
    async (selectId?: string | null) => {
      try {
        const data = await api.get<{
          conversations: Conversation[]
          pagination: { total: number; pages: number }
        }>('/api/ai/conversations')
        setConversations(data.conversations)
        setConversationTotal(data.pagination.total)
        setConversationPage(1)
        if (selectId) {
          const conv = data.conversations.find((c) => c.id === selectId)
          if (conv) setMessages(conv.messages)
        }
      } catch {
        // list stays as-is
      }
    },
    [],
  )

  const loadOlderConversations = useCallback(async () => {
    setLoadingOlder(true)
    try {
      const data = await api.get<{
        conversations: Conversation[]
        pagination: { total: number; pages: number }
      }>(`/api/ai/conversations?page=${conversationPage + 1}&per_page=50`)
      setConversations((prev) => {
        const known = new Set(prev.map((c) => c.id))
        return [...prev, ...data.conversations.filter((c) => !known.has(c.id))]
      })
      setConversationTotal(data.pagination.total)
      setConversationPage((p) => p + 1)
    } catch {
      toast({ kind: 'warning', title: 'Could not load conversations', message: 'Please try again.' })
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationPage, toast])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, typing, pendingConfirm])

  const selectConversation = (c: Conversation) => {
    setActiveId(c.id)
    setMessages(c.messages)
    setPendingConfirm(null)
  }

  const append = (role: string, content: string, toolName?: string | null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role,
        content,
        toolName: toolName ?? null,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  const send = async (raw: string) => {
    const q = raw.trim()
    if (!q || typing) return
    const conversationId = activeId
    append('user', q)
    setInput('')
    setTyping(true)
    try {
      const res = await api.post<ChatResult>('/api/ai/chat', { message: q, conversationId })
      if (res.kind === 'needsConfirmation') {
        append('assistant', res.content)
        setPendingConfirm({
          conversationId: res.conversationId,
          toolName: res.toolName,
          args: res.args,
          summary: res.summary,
        })
        if (!activeId) setActiveId(res.conversationId)
        await refreshConversations()
      } else if (res.kind === 'reply') {
        append('assistant', res.content)
        if (!activeId) {
          setActiveId(res.conversationId)
          await refreshConversations(res.conversationId)
        } else {
          await refreshConversations()
        }
      } else {
        append('assistant', res.content)
        if (!activeId) setActiveId(res.conversationId)
        await refreshConversations()
        toast({
          kind: 'warning',
          title: 'VANTA AI is not configured',
          message: 'Add a GEMINI_API_KEY or OPENAI_API_KEY to enable the assistant.',
        })
      }
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1))
      toast({
        kind: 'warning',
        title: 'Could not reach VANTA AI',
        message: err instanceof ApiClientError ? err.message : 'Please try again.',
      })
    } finally {
      setTyping(false)
    }
  }

  const confirmAction = async () => {
    if (!pendingConfirm) return
    setConfirming(true)
    try {
      const res = await api.post<{ conversationId: string; content: string; outcome: string }>(
        '/api/ai/confirm',
        {
          conversationId: pendingConfirm.conversationId,
          toolName: pendingConfirm.toolName,
          args: pendingConfirm.args,
        },
      )
      append('assistant', res.content)
      setPendingConfirm(null)
      toast({ kind: 'ai', title: 'Action complete', message: res.outcome })
      await refreshConversations()
    } catch (err) {
      toast({
        kind: 'warning',
        title: 'Could not complete the action',
        message: err instanceof ApiClientError ? err.message : 'Please try again.',
      })
    } finally {
      setConfirming(false)
    }
  }

  const newChat = () => {
    setActiveId(null)
    setMessages([])
    setPendingConfirm(null)
  }

  const deleteConversation = async (id: string) => {
    setDeletingId(id)
    try {
      await api.del(`/api/ai/conversations/${id}`)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) newChat()
    } catch {
      toast({ kind: 'warning', title: 'Could not delete conversation', message: 'Please try again.' })
    } finally {
      setDeletingId(null)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const activeConv = conversations.find((c) => c.id === activeId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-violet/25 bg-violet/10">
          <BrandMark size={18} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-canvas bg-emerald" />
        </span>
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-fg lg:text-[22px]">VANTA AI</h1>
          <p className="text-[12.5px] text-fg-3">Live analysis of your entire workspace</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => void send(p)}
            disabled={typing}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-fg-2 transition-colors duration-150 hover:border-violet/35 hover:text-violet disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-4 flex h-[calc(100dvh-290px)] min-h-[440px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface md:h-[calc(100dvh-250px)]">
        <div className="flex h-full min-h-0">
          <div className="hidden w-[250px] shrink-0 flex-col border-r border-line md:flex">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-3">Conversations</p>
              <button
                onClick={newChat}
                className="flex size-7 items-center justify-center rounded-[7px] border border-line text-fg-3 transition-colors duration-150 hover:border-violet/35 hover:text-violet"
                aria-label="New chat"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              {conversations.length === 0 ? (
                <p className="px-3 py-8 text-center text-[12.5px] text-fg-3">No conversations yet.</p>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'group mb-1 flex items-center gap-2 rounded-[8px] px-2.5 py-2 transition-colors duration-150',
                      activeId === c.id ? 'bg-raised' : 'hover:bg-hover',
                    )}
                  >
                    <button
                      onClick={() => selectConversation(c)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className={cn('truncate text-[13px]', activeId === c.id ? 'text-fg' : 'text-fg-2')}>
                        {c.title ?? 'Untitled'}
                      </p>
                      <p className="text-[11px] text-fg-3">{timeAgo(c.updatedAt)}</p>
                    </button>
                    <button
                      onClick={() => void deleteConversation(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded-md p-1 text-fg-3 opacity-0 transition-all duration-150 hover:text-danger group-hover:opacity-100 disabled:opacity-40"
                      aria-label="Delete conversation"
                    >
                      {deletingId === c.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                ))
              )}
              {conversationTotal > conversations.length && (
                <div className="p-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    full
                    onClick={() => void loadOlderConversations()}
                    loading={loadingOlder}
                  >
                    Load older
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line px-3 py-2 no-scrollbar md:hidden">
              <button
                onClick={newChat}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150',
                  !activeId ? 'border-violet/40 bg-violet/10 text-violet' : 'border-line text-fg-3 hover:text-fg',
                )}
              >
                <Plus size={12} />
                New
              </button>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150',
                    activeId === c.id ? 'border-violet/40 bg-violet/10 text-violet' : 'border-line text-fg-3 hover:text-fg',
                  )}
                >
                  {c.title ?? 'Untitled'}
                </button>
              ))}
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 [scrollbar-width:thin]"
            >
              {messages.length === 0 && !typing && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-12 items-center justify-center rounded-[12px] border border-violet/25 bg-violet/10">
                    <BrandMark size={22} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-fg">
                    {activeConv ? activeConv.title ?? 'Conversation' : 'Ask me anything'}
                  </h3>
                  <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-3">
                    I can read your entire workspace — clients, projects, tasks, invoices, and revenue. Ask about overdue balances, behind-schedule projects, or your top clients.
                  </p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {m.role === 'user' ? (
                      <div className="max-w-[85%] rounded-2xl rounded-br-md border border-violet/20 bg-violet/10 px-4 py-2.5 text-[13.5px] whitespace-pre-wrap text-fg">
                        {m.content}
                      </div>
                    ) : m.role === 'tool' ? (
                      <div className="flex max-w-[85%] items-start gap-2 rounded-[12px] border border-line bg-surface-2 px-3.5 py-2.5 text-[12.5px] text-fg-2">
                        <Check size={14} className="mt-0.5 shrink-0 text-emerald" />
                        <span className="whitespace-pre-wrap">
                          {m.toolName ? `Action performed · ${m.content}` : m.content}
                        </span>
                      </div>
                    ) : (
                      <div className="flex max-w-[92%] items-start gap-2.5">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
                          <BrandMark size={13} />
                        </span>
                        <div className="min-w-0 rounded-[14px] rounded-tl-md border border-line bg-surface px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-fg-2 shadow-[var(--shadow-card)]">
                          {m.content}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {pendingConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
                    <BrandMark size={13} />
                  </span>
                  <div className="w-full max-w-[92%] rounded-[14px] border border-violet/30 bg-violet/[0.06] p-4 shadow-[var(--shadow-card)]">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-violet">
                      <Sparkles size={14} />
                      Confirmation needed
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-fg-2">
                      {pendingConfirm.summary}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" onClick={() => void confirmAction()} loading={confirming}>
                        <Check size={13} />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingConfirm(null)}
                        disabled={confirming}
                      >
                        <X size={13} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex size-7 items-center justify-center rounded-full border border-line bg-surface">
                    <BrandMark size={13} />
                  </span>
                  <span className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                        className="h-1.5 w-1.5 rounded-full bg-violet"
                      />
                    ))}
                  </span>
                </motion.div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-line p-3"
            >
              <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-line bg-surface-2 px-3.5 transition-all duration-150 focus-within:border-violet/50 focus-within:shadow-[var(--shadow-focus)]">
                <Sparkles size={15} className="shrink-0 text-violet" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask VANTA anything about your business…"
                  className="h-11 flex-1 bg-transparent text-[13.5px] text-fg placeholder:text-fg-3/70 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet text-canvas transition-all duration-150 hover:bg-violet-bright disabled:opacity-35"
                  aria-label="Send"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
