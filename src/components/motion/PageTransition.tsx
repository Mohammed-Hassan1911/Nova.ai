'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { EASE_OUT } from './variants'

type PageTransitionProps = {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 12, filter: 'blur(8px)' }
        }
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }
            : {
                opacity: 0,
                y: -8,
                filter: 'blur(6px)',
                transition: { duration: 0.16, ease: 'easeIn' },
              }
        }
        transition={{ duration: 0.34, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
