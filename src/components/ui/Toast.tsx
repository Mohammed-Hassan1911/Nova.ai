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
import { Info, Sparkles, AlertTriangle, X } from 'lucide-react'
import { EASE_OUT } from '@/components/motion/variants'

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

function SuccessCheck() {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24, delay: 0.08 }}
    >
      <motion.path
        d="M2.5 7.2 5.7 10.4 11.5 3.6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.1 }}
      />
    </motion.svg>
  )
}

const toastConfig: Record<ToastKind, { icon: ReactNode; cls: string; bar: string }> = {
  success: { icon: <SuccessCheck />, cls: 'bg-emerald/15 text-emerald', bar: 'bg-emerald/60' },
  info: { icon: <Info size={14} strokeWidth={2} />, cls: 'bg-cyan/15 text-cyan', bar: 'bg-cyan/60' },
  ai: { icon: <Sparkles size={14} strokeWidth={2} />, cls: 'bg-violet/15 text-violet-bright', bar: 'bg-violet/60' },
  warning: { icon: <AlertTriangle size={14} strokeWidth={2} />, cls: 'bg-danger/15 text-danger', bar: 'bg-danger/60' },
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
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, y: -6, scale: 0.97, transition: { duration: 0.18 } }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="pointer-events-auto panel-hairline relative flex items-start gap-3 overflow-hidden rounded-[14px] border border-line-strong bg-surface-2/95 px-3.5 py-3 shadow-[var(--shadow-pop)] backdrop-blur-md"
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
                className="rounded-md p-1 text-fg-3 transition-colors duration-[220ms] ease-out hover:bg-hover hover:text-fg"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
              <span
                aria-hidden
                className={`absolute bottom-0 left-0 h-[2px] w-full origin-left ${toastConfig[t.kind].bar}`}
                style={{ animation: 'toast-progress 3.6s linear both' }}
              />
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
