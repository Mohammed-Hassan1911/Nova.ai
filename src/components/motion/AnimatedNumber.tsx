'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

import { EASE_OUT } from './variants'

type AnimatedNumberProps = {
  value: number
  format?: (value: number) => string
  duration?: number
  from?: number
}

export function AnimatedNumber({
  value,
  format,
  duration = 0.8,
  from,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(from ?? value)
  const fromRef = useRef(from ?? value)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const controls = animate(fromRef.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(v),
    })
    fromRef.current = value
    return () => controls.stop()
  }, [value, duration, reduceMotion])

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>
}
