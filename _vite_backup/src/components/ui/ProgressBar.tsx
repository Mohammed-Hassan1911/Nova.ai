import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  className,
  tone,
}: {
  value: number
  className?: string
  tone?: 'gold' | 'emerald' | 'danger'
}) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'h-full rounded-full',
          tone === 'danger' && 'bg-danger',
          tone === 'emerald' && 'bg-emerald',
          (!tone || tone === 'gold') && 'bg-gold/80',
        )}
      />
    </div>
  )
}
