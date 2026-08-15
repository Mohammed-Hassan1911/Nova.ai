'use client'

import { useMemo, useState } from 'react'
import { fmt } from '@/lib/utils'

const W = 640
const H = 240
const PAD = { top: 16, right: 8, bottom: 22, left: 8 }

export interface ChartPoint {
  label: string
  value: number
}

export function RevenueChart({
  points,
  height = 240,
}: {
  points: ChartPoint[]
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)

  const { x, y, area, line } = useMemo(() => {
    const n = points.length
    const max = Math.max(...points.map((p) => p.value), 1) * 1.12
    const min = 0
    const xi = (i: number) => PAD.left + (i / Math.max(n - 1, 1)) * (W - PAD.left - PAD.right)
    const yi = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xi(i)} ${yi(p.value)}`).join(' ')
    const areaPath = `${path} L ${xi(n - 1)} ${H - PAD.bottom} L ${xi(0)} ${H - PAD.bottom} Z`
    return { x: xi, y: yi, area: areaPath, line: path }
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
            <stop offset="0%" stopColor="#C9A86C" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#C9A86C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + t * (H - PAD.top - PAD.bottom)}
            y2={PAD.top + t * (H - PAD.top - PAD.bottom)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#rev-fill)" />
        <path d={line} fill="none" stroke="#C9A86C" strokeWidth="1.8" strokeLinecap="round" />

        {hover !== null && points[hover] && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="rgba(201,168,108,0.35)"
              strokeWidth="1"
            />
            <circle cx={x(hover)} cy={y(points[hover].value)} r="4" fill="#C9A86C" stroke="#09090b" strokeWidth="2" />
          </g>
        )}

        {points.map((_, i) => (
          <rect
            key={i}
            x={x(i) - 2}
            y={PAD.top}
            width={4}
            height={H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-[8px] border border-line-strong bg-surface-2/95 px-2.5 py-1.5 shadow-[var(--shadow-pop)]"
          style={{ left: `calc(${(x(hover) / W) * 100}% - 40px)` }}
        >
          <p className="text-[12px] font-semibold tabular text-fg">{fmt(points[hover].value)}</p>
          <p className="text-[10.5px] text-fg-3">{points[hover].label}</p>
        </div>
      )}

      <div className="mt-1 flex justify-between px-1">
        <span className="text-[10.5px] text-fg-3">{points[0]?.label}</span>
        <span className="text-[10.5px] text-fg-3">{points[Math.floor((points.length - 1) / 2)]?.label}</span>
        <span className="text-[10.5px] text-fg-3">{points[points.length - 1]?.label}</span>
      </div>
    </div>
  )
}
