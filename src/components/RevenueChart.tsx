'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fmt } from '@/lib/utils'
import { EASE_OUT } from '@/components/motion/variants'

const W = 640
const H = 280
const PAD = { top: 24, right: 8, bottom: 24, left: 8 }

export interface ChartPoint {
  label: string
  value: number
}

export function RevenueChart({
  points,
  height = 280,
}: {
  points: ChartPoint[]
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)

  const { x, y, area, line, glowLine } = useMemo(() => {
    const n = points.length
    const max = Math.max(...points.map((p) => p.value), 1) * 1.15
    const min = 0
    const xi = (i: number) => PAD.left + (i / Math.max(n - 1, 1)) * (W - PAD.left - PAD.right)
    const yi = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xi(i)} ${yi(p.value)}`).join(' ')
    const areaPath = `${path} L ${xi(n - 1)} ${H - PAD.bottom} L ${xi(0)} ${H - PAD.bottom} Z`
    const glow = `${path} L ${xi(n - 1)} ${yi(points[n - 1].value) + 7} L ${xi(0)} ${yi(points[0].value) + 7} Z`
    return { x: xi, y: yi, area: areaPath, line: path, glowLine: glow }
  }, [points])

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#8B5CF6" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rev-line" x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="60%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => (
          <motion.line
            key={t}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT }}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + t * (H - PAD.top - PAD.bottom)}
            y2={PAD.top + t * (H - PAD.top - PAD.bottom)}
            stroke="rgba(255,255,255,0.055)"
            strokeWidth="1"
          />
        ))}

        <motion.line
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE_OUT }}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        <motion.path
          d={area}
          fill="url(#rev-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT }}
        />
        <motion.path
          d={glowLine}
          fill="rgba(139,92,246,0.22)"
          filter="blur(8px)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="url(#rev-line)"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.15, delay: 0.2, ease: EASE_OUT }}
        />

        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={hover === i ? 4.6 : 3.2}
            fill="#8B5CF6"
            stroke="#050505"
            strokeWidth="1.6"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.03, ease: EASE_OUT }}
          />
        ))}

        {hover !== null && points[hover] && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="rgba(139,92,246,0.45)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <motion.circle
              cx={x(hover)}
              cy={y(points[hover].value)}
              r={9}
              fill="none"
              stroke="rgba(34,211,238,0.4)"
              strokeWidth="1"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            />
          </g>
        )}

        {points.map((_, i) => (
          <rect
            key={i}
            x={x(i) - 4}
            y={PAD.top}
            width={8}
            height={H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null && points[hover] && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="glass-strong pointer-events-none absolute top-1 z-10 rounded-[10px] px-3 py-1.5 shadow-[var(--shadow-pop)]"
          style={{ left: `calc(${(x(hover) / W) * 100}% - 44px)` }}
        >
          <p className="text-[13px] font-semibold tabular text-violet-bright">{fmt(points[hover].value)}</p>
          <p className="text-[10.5px] text-fg-3">{points[hover].label}</p>
        </motion.div>
      )}

      <div className="mt-1.5 flex justify-between px-1">
        <span className="text-[10.5px] text-fg-3">{points[0]?.label}</span>
        {points.length > 2 && (
          <span className="text-[10.5px] text-fg-3">
            {points[Math.floor((points.length - 1) / 2)]?.label}
          </span>
        )}
        <span className="text-[10.5px] text-fg-3">{points[points.length - 1]?.label}</span>
      </div>
    </div>
  )
}
