'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, summary'

export function Cursor() {
  const reduceMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [pressed, setPressed] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 420, damping: 34, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 420, damping: 34, mass: 0.6 })

  useEffect(() => {
    if (reduceMotion) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)
    document.documentElement.classList.add('custom-cursor')

    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const target = e.target as HTMLElement | null
      setHovering(!!target?.closest(INTERACTIVE))
    }
    const down = () => setPressed(true)
    const up = () => setPressed(false)
    const leave = () => {
      x.set(-100)
      y.set(-100)
    }

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      document.documentElement.classList.remove('custom-cursor')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [reduceMotion, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        className="nova-cursor-dot"
        style={{ x, y }}
        animate={{ scale: hovering ? 0 : pressed ? 0.4 : 1, opacity: hovering ? 0.4 : 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="nova-cursor-ring"
        style={{ x: ringX, y: ringY }}
        animate={{
          scale: hovering ? 1.65 : pressed ? 0.8 : 1,
          opacity: hovering ? 1 : 0.8,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.6 }}
      />
    </>
  )
}
