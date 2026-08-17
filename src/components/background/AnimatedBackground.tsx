'use client'

import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { cn } from '@/lib/utils'

type Variant = 'cinematic' | 'app'

const PALETTE_FAR = ['255,255,255', '139,92,246', '139,92,246']
const PALETTE_MID = ['139,92,246', '34,211,238', '255,255,255']
const PALETTE_NEAR = ['34,211,238', '139,92,246']

export function AnimatedBackground({
  variant = 'cinematic',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const subtle = variant === 'app'

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 34, damping: 24, mass: 0.7 })
  const sy = useSpring(my, { stiffness: 34, damping: 24, mass: 0.7 })

  // Per-layer parallax multipliers — far layers barely move, near layers a touch more.
  const glowX = useTransform(sx, (v) => v * 30)
  const glowY = useTransform(sy, (v) => v * 22)
  const farX = useTransform(sx, (v) => v * 7)
  const farY = useTransform(sy, (v) => v * 6)
  const midX = useTransform(sx, (v) => v * 14)
  const midY = useTransform(sy, (v) => v * 11)
  const nearX = useTransform(sx, (v) => v * 22)
  const nearY = useTransform(sy, (v) => v * 17)
  const gridX = useTransform(sx, (v) => v * 10)
  const gridY = useTransform(sy, (v) => v * 8)

  useEffect(() => {
    if (reduceMotion) return
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return
    const move = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [reduceMotion, mx, my])

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas',
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {/* ---- ambient glows ---- */}
        <motion.div style={{ x: glowX, y: glowY }} className="absolute inset-0">
          <div
            className={cn(
              'absolute left-[-10%] top-[-14%] size-[640px] rounded-full mix-blend-screen',
              !reduceMotion && 'animate-[orb-drift-a_52s_ease-in-out_infinite]',
            )}
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 62%)',
              opacity: subtle ? 0.16 : 0.26,
            }}
          />
          <div
            className={cn(
              'absolute right-[-12%] top-[14%] size-[600px] rounded-full mix-blend-screen',
              !reduceMotion && 'animate-[orb-drift-b_44s_ease-in-out_infinite]',
            )}
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.4), transparent 60%)',
              opacity: subtle ? 0.12 : 0.2,
            }}
          />
          <div
            className={cn(
              'absolute bottom-[-20%] left-[20%] size-[760px] rounded-full mix-blend-screen',
              !reduceMotion && 'animate-[orb-drift-a_64s_ease-in-out_infinite]',
            )}
            style={{
              background: 'radial-gradient(circle, rgba(76,29,149,0.55), transparent 62%)',
              opacity: subtle ? 0.15 : 0.24,
            }}
          />
          <div
            className={cn(
              'absolute left-[38%] top-[-26%] size-[560px] rounded-full mix-blend-screen',
              !reduceMotion && 'animate-[orb-drift-b_58s_ease-in-out_infinite]',
            )}
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 62%)',
              opacity: subtle ? 0.12 : 0.2,
            }}
          />
        </motion.div>

        {/* ---- focal orbs ---- */}
        <motion.div style={{ x: nearX, y: nearY }} className="absolute inset-0">
          <div
            className={cn(
              'absolute left-[16%] top-[30%] size-[150px] rounded-full blur-[70px] mix-blend-screen',
              !reduceMotion && 'animate-[orb-drift-b_40s_ease-in-out_infinite]',
            )}
            style={{ background: 'rgba(139,92,246,0.4)', opacity: subtle ? 0.3 : 0.45 }}
          />
          <div
            className={cn(
              'absolute right-[18%] top-[58%] size-[120px] rounded-full blur-[64px] mix-blend-screen',
              !reduceMotion && 'animate-[orb-drift-a_46s_ease-in-out_infinite]',
            )}
            style={{ background: 'rgba(34,211,238,0.35)', opacity: subtle ? 0.24 : 0.38 }}
          />
        </motion.div>

        {/* ---- neural grid ---- */}
        <motion.div style={{ x: gridX, y: gridY }} className="absolute inset-0">
          <div
            className={cn(
              'neural-grid absolute inset-0',
              !reduceMotion && 'animate-[drift_60s_linear_infinite]',
            )}
            style={{
              opacity: subtle ? 0.28 : 0.5,
              maskImage: 'radial-gradient(1100px 760px at 50% 22%, black 0%, transparent 72%)',
              WebkitMaskImage:
                'radial-gradient(1100px 760px at 50% 22%, black 0%, transparent 72%)',
            }}
          />
        </motion.div>

        {/* ---- particles: far / mid / near ---- */}
        <ParticleLayer
          parallaxX={farX}
          parallaxY={farY}
          count={subtle ? 16 : 24}
          minR={0.5}
          maxR={1}
          alpha={0.35}
          speed={0.05}
          colors={PALETTE_FAR}
        />
        <ParticleLayer
          parallaxX={midX}
          parallaxY={midY}
          count={subtle ? 9 : 15}
          minR={1}
          maxR={1.8}
          alpha={0.5}
          speed={0.1}
          colors={PALETTE_MID}
          link
          linkDist={130}
        />
        <ParticleLayer
          parallaxX={nearX}
          parallaxY={nearY}
          count={subtle ? 3 : 6}
          minR={2}
          maxR={3.2}
          alpha={0.85}
          speed={0.06}
          colors={PALETTE_NEAR}
          glow
        />

        {/* ---- bottom vignette so content sits on calmer ground ---- */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(140% 100% at 50% 42%, transparent 52%, rgba(0,0,0,0.52) 100%)',
          }}
        />
        {subtle && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 10%, transparent 40%, rgba(5,5,5,0.38) 100%)',
            }}
          />
        )}
      </motion.div>
    </div>
  )
}

type ParticleLayerProps = {
  parallaxX: MotionValue<number>
  parallaxY: MotionValue<number>
  count: number
  minR: number
  maxR: number
  alpha: number
  speed: number
  colors: string[]
  link?: boolean
  linkDist?: number
  glow?: boolean
}

function ParticleLayer({
  parallaxX,
  parallaxY,
  count,
  minR,
  maxR,
  alpha,
  speed,
  colors,
  link,
  linkDist = 120,
  glow,
}: ParticleLayerProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coarse =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    const small = typeof window !== 'undefined' && window.innerWidth < 640
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const n = coarse || small ? Math.max(3, Math.floor(count / 2)) : count
    let w = 0
    let h = 0
    let raf = 0
    let running = !reduceMotion
    let t = 0

    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string; a: number }
    let pts: P[] = []

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        r: minR + Math.random() * (maxR - minR),
        c: colors[Math.floor(Math.random() * colors.length)],
        a: alpha * (0.5 + Math.random() * 0.5),
      }))
      if (!running) drawFrame()
    }

    const drawFrame = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -24) p.x = w + 24
        else if (p.x > w + 24) p.x = -24
        if (p.y < -24) p.y = h + 24
        else if (p.y > h + 24) p.y = -24
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.c},${p.a})`
        if (glow) {
          ctx.shadowColor = `rgba(${p.c},0.8)`
          ctx.shadowBlur = 8
        }
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (link) {
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i]
          for (let j = i + 1; j < pts.length; j++) {
            const b = pts[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const d2 = dx * dx + dy * dy
            if (d2 < linkDist * linkDist) {
              const dist = Math.sqrt(d2)
              // lines slowly breathe in/out instead of being static
              const breathe = 0.72 + 0.28 * Math.sin(t * 0.012 + i * 0.8)
              const alpha = (1 - dist / linkDist) * 0.1 * breathe
              ctx.strokeStyle = `rgba(139,92,246,${alpha})`
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = () => {
      if (!running) return
      drawFrame()
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else if (running) {
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    if (running) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [count, minR, maxR, alpha, speed, colors, link, linkDist, glow, reduceMotion])

  return (
    <motion.div style={{ x: parallaxX, y: parallaxY }} className="absolute inset-0">
      <canvas ref={ref} className="absolute inset-0" />
    </motion.div>
  )
}
