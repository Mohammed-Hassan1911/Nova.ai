import { useId } from 'react'
import { cn } from '@/lib/utils'

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  const uid = useId().replace(/[:]/g, '')
  const tile = `vg-${uid}-tile`
  const stroke = `vg-${uid}-stroke`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn(
        'shrink-0 transition-transform duration-[350ms] ease-out hover:scale-[1.05]',
        className,
      )}
      aria-hidden
    >
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#42189b" />
        </linearGradient>
        <linearGradient id={stroke} x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`${uid}-core`} cx="0.5" cy="0.42" r="0.65">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft interior glow */}
      <rect width="40" height="40" rx="11" fill={`url(#${uid}-core)`} />

      <rect width="40" height="40" rx="11" fill="url(#tile)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" stroke="rgba(255,255,255,0.22)" />
      <rect x="3" y="3" width="34" height="34" rx="8.5" stroke="rgba(255,255,255,0.08)" />

      {/* layered geometric V */}
      <path
        d="M11.5 11.2 L19.2 25.4 L28.5 11.2"
        stroke="url(#stroke)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.7 12.9 L19.7 21.4 L24.3 12.9"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* cyan focal node */}
      <circle cx="20" cy="30.4" r="2.2" fill="#22d3ee" />
      <g style={{ transformOrigin: 'center', transformBox: 'fill-box' }}>
        <circle
          cx="20"
          cy="30.4"
          r="4.4"
          stroke="rgba(34, 211, 238, 0.4)"
          strokeWidth="1.1"
          className="animate-[logo-breathe_5.5s_ease-in-out_infinite]"
          style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
        />
      </g>

      {/* drifting satellite dot */}
      <circle
        cx="29.8"
        cy="12.4"
        r="1.5"
        fill="#22d3ee"
        opacity="0.95"
        className="animate-[dot-drift_7s_ease-in-out_infinite]"
        style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
      />
    </svg>
  )
}

export function Logo({
  size = 32,
  className,
  compact,
}: {
  size?: number
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark size={size} />
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[0.2em] text-fg">VANTA</span>
      )}
    </div>
  )
}
