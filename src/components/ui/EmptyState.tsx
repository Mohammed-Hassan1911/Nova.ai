import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EASE_OUT } from '@/components/motion/variants'

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-dashed border-line bg-surface/50 px-6 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05, ease: EASE_OUT }}
        className="dot-grid relative flex size-14 items-center justify-center rounded-[16px] border border-line bg-surface-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        <Icon size={21} className="text-violet/80" strokeWidth={1.7} />
      </motion.div>
      <h3 className="mt-5 text-[15px] font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-3">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
