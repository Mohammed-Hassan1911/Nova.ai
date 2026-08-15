import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Zap, ArrowRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NovaMark } from '@/components/ui/Logo'
import { useAppState } from '@/store/AppState'
import { analyze, quickActions, quickPrompts, type AiResult } from '@/data/mock'

interface ChatMessage {
  id: number
  role: 'user' | 'nova'
  text?: string
  result?: AiResult
}

let messageId = 0

const welcome: AiResult = {
  intent: 'welcome',
  title: 'NOVA AI is ready',
  summary:
    'I can read your entire workspace — clients, projects, tasks, invoices, and revenue. Ask me anything about your business, and I’ll turn the data into a clear answer with a recommended next step.',
  bullets: [
    'Ask about overdue invoices or unpaid balances.',
    'Check which projects are behind schedule.',
    'Find your top clients by revenue.',
    'Get a prioritized plan for today.',
  ],
}

export function Assistant() {
  const { navigate } = useAppState()
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: ++messageId, role: 'nova', result: welcome },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  const quick = useMemo(() => quickActions, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, typing])

  const respond = (query: string) => {
    setTyping(true)
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: ++messageId, role: 'nova', result: analyze(query) },
      ])
      setTyping(false)
    }, 800)
  }

  const submit = (query: string) => {
    const q = query.trim()
    if (!q || typing) return
    setMessages((prev) => [...prev, { id: ++messageId, role: 'user', text: q }])
    setInput('')
    respond(q)
  }

  const runAction = (target: AiResult['action']) => {
    if (!target) return
    if (target.target === 'overview') navigate({ view: 'overview' })
    else if (target.target === 'clients') navigate({ view: 'clients' })
    else if (target.target === 'projects') navigate({ view: 'projects' })
    else if (target.target === 'tasks') navigate({ view: 'tasks' })
    else navigate({ view: 'invoices' })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-gold/25 bg-gold/10">
          <NovaMark size={18} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-canvas bg-emerald" />
        </span>
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-fg lg:text-[22px]">
            NOVA AI
          </h1>
          <p className="text-[12.5px] text-fg-3">Live analysis of your entire workspace</p>
        </div>
      </div>

      {/* quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {quick.map((a) => (
          <button
            key={a.id}
            onClick={() => submit(a.prompt)}
            disabled={typing}
            className="group flex items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2.5 text-left text-[12.5px] font-medium text-fg-2 transition-all duration-150 hover:border-gold/35 hover:bg-surface-2 hover:text-fg disabled:opacity-50"
          >
            <Zap size={13} className="text-gold" />
            {a.label}
            <ArrowRight size={12} className="ml-auto text-fg-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      {/* chat */}
      <div
        ref={scrollRef}
        className="mt-4 flex-1 space-y-4 overflow-y-auto pb-2 pr-0.5 [scrollbar-width:thin]"
      >
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
                <div className="max-w-[85%] rounded-2xl rounded-br-md border border-gold/20 bg-gold/10 px-4 py-2.5 text-[13.5px] text-fg">
                  {m.text}
                </div>
              ) : m.result ? (
                <AiCard result={m.result} onAction={() => runAction(m.result?.action)} />
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface">
              <NovaMark size={13} />
            </span>
            <span className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                  className="h-1.5 w-1.5 rounded-full bg-gold"
                />
              ))}
            </span>
          </motion.div>
        )}
      </div>

      {/* suggestions */}
      <div className="mt-3">
        <p className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.1em] text-fg-3">
          Try asking
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => submit(p)}
              disabled={typing}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-fg-2 transition-colors duration-150 hover:border-gold/35 hover:text-gold disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* input */}
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          submit(input)
        }}
        className="mt-3"
      >
        <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-line bg-surface px-3.5 transition-all duration-150 focus-within:border-gold/50 focus-within:shadow-[var(--shadow-focus)]">
          <Sparkles size={15} className="shrink-0 text-gold" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask NOVA anything about your business…"
            className="h-11 flex-1 bg-transparent text-[13.5px] text-fg placeholder:text-fg-3/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold text-canvas transition-all duration-150 hover:bg-gold-bright disabled:opacity-35"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  )
}

function AiCard({ result, onAction }: { result: AiResult; onAction: () => void }) {
  return (
    <div className="max-w-[92%] rounded-[14px] rounded-tl-md border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
          <NovaMark size={13} />
        </span>
        <p className="text-[13px] font-semibold text-fg">{result.title}</p>
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-fg-2">{result.summary}</p>
      <ul className="mt-3 space-y-1.5">
        {result.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] text-fg-3">
            <Circle size={5} className="mt-1.5 shrink-0 fill-gold text-gold" />
            {b}
          </li>
        ))}
      </ul>
      {result.action && (
        <button
          onClick={onAction}
          className="mt-3.5 flex items-center gap-1.5 rounded-[8px] bg-gold/12 px-3 py-1.5 text-[12.5px] font-medium text-gold transition-colors duration-150 hover:bg-gold/20"
        >
          {result.action.label}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  )
}
