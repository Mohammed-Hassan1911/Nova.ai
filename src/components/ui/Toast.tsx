'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Info, Sparkles, AlertTriangle, X } from 'lucide-react'

type ToastKind = 'success' | 'info' | 'ai' | 'warning'

interface Toast {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

interface ToastContextValue {
  toast: (opts: { kind?: ToastKind; title: string; message?: string }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastConfig: Record<ToastKind, { icon: ReactNode; cls: string }> = {
  success: { icon: <Check size={14} strokeWidth={2.6} />, cls: 'bg-emerald/12 text-emerald' },
  info: { icon: <Info size={14} strokeWidth={2} />, cls: 'bg-white/8 text-fg-2' },
  ai: { icon: <Sparkles size={14} strokeWidth={2} />, cls: 'bg-gold/15 text-gold' },
  warning: { icon: <AlertTriangle size={14} strokeWidth={2} />, cls: 'bg-danger/15 text-danger' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ kind = 'success', title, message }: { kind?: ToastKind; title: string; message?: string }) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-2), { id, kind, title, message }])
      window.setTimeout(() => dismiss(id), 3600)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="pointer-events-auto flex items-start gap-3 rounded-[12px] border border-line-strong bg-surface-2/95 px-3.5 py-3 shadow-[var(--shadow-pop)] backdrop-blur-md"
            >
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${toastConfig[t.kind].cls}`}
              >
                {toastConfig[t.kind].icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-tight text-fg">
                  {t.title}
                </p>
                {t.message && (
                  <p className="mt-0.5 text-[12.5px] leading-snug text-fg-2">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
