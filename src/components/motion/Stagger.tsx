'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Children, type ReactNode } from 'react'

import { EASE_OUT } from './variants'

type StaggerProps = {
  children: ReactNode
  stagger?: number
  delayChildren?: number
  className?: string
}

export function Stagger({
  children,
  stagger = 0.08,
  delayChildren = 0,
  className,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren } },
      }}
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  )
}

type StaggerGroupProps = {
  children: ReactNode
  className?: string
  stagger?: number
  delayChildren?: number
  y?: number
}

/**
 * Wraps every direct child in a staggered fade-up so plain DOM children
 * (form fields, buttons, cards) enter in sequence without needing each
 * child to be a motion component.
 */
export function StaggerGroup({
  children,
  className,
  stagger = 0.07,
  delayChildren = 0.2,
  y = 12,
}: StaggerGroupProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren } },
      }}
    >
      {Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: reduceMotion ? 0 : y },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
