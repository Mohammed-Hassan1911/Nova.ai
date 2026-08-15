import { cn } from '@/lib/utils'

export function NovaMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="9" fill="#101014" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        stroke="rgba(255,255,255,0.09)"
      />
      <circle cx="16" cy="16" r="2.6" fill="#C9A86C" />
      <circle cx="8.6" cy="22.8" r="2" fill="#34D399" />
      <circle cx="23.4" cy="9.2" r="1.6" fill="#F4F4F5" opacity="0.5" />
      <path
        d="M16 16L8.6 22.8"
        stroke="rgba(201,168,108,0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M16 16L23.4 9.2"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.1"
        strokeLinecap="round"
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
      <NovaMark size={size} />
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[0.14em] text-fg">
          NOVA
        </span>
      )}
    </div>
  )
}
