'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/components/motion/variants'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.06 }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        {eyebrow && <span className="eyebrow text-violet-bright">{eyebrow}</span>}
        <h1
          className={cn(
            'text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]',
            eyebrow && 'mt-2',
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-fg-3">{subtitle}</p>}
      </div>
      {actions}
    </motion.div>
  )
}
