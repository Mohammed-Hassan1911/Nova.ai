import { cn } from '@/lib/utils'

const tones = [
  'bg-violet/[0.14] text-violet',
  'bg-emerald/[0.12] text-emerald',
  'bg-info/[0.12] text-info',
  'bg-white/[0.07] text-fg-2',
  'bg-danger/[0.12] text-danger',
]

function toneFor(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return tones[h % tones.length]
}

export function Avatar({
  initials,
  size = 36,
  className,
  status,
}: {
  initials: string
  size?: number
  className?: string
  status?: 'online'
}) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-[9px] border border-white/[0.07] font-semibold',
        toneFor(initials),
        className,
      )}
    >
      {initials}
      {status && (
        <span className="absolute -bottom-0.5 -right-0.5 size-[9px] rounded-full border-2 border-surface bg-emerald" />
      )}
    </span>
  )
}
