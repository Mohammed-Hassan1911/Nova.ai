import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT } from '@/components/motion/variants'

export function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 320,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const ref = useRef<HTMLDivElement>(null)

  const setOpen = (v: boolean) => {
    setInternalOpen(v)
    onOpenChange?.(v)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            style={{ width, right: align === 'right' ? 0 : 'auto', left: align === 'left' ? 0 : 'auto' }}
            className="absolute top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] glass-panel"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
