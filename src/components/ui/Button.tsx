import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  full?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-[#9d6bff] via-[#8b5cf6] to-[#6d3ff0] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_24px_-10px_rgba(139,92,246,0.55)] hover:-translate-y-[1px] hover:from-[#a97bff] hover:to-[#7c4dff] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_32px_-10px_rgba(139,92,246,0.7)] active:translate-y-0 active:scale-[0.97] active:brightness-95',
  secondary:
    'border border-line-strong bg-surface-2 text-fg hover:-translate-y-[1px] hover:border-white/25 hover:bg-pressed active:translate-y-0 active:scale-[0.98]',
  outline:
    'border border-violet/40 bg-violet/[0.06] text-violet-bright hover:-translate-y-[1px] hover:border-violet/60 hover:bg-violet/[0.12] active:translate-y-0 active:scale-[0.98]',
  ghost: 'text-fg-2 hover:bg-hover hover:text-fg active:scale-[0.98]',
  danger:
    'border border-danger/30 bg-danger/10 text-danger hover:-translate-y-[1px] hover:bg-danger/20 active:translate-y-0 active:scale-[0.98]',
  success:
    'border border-emerald/30 bg-emerald/10 text-emerald hover:-translate-y-[1px] hover:bg-emerald/20 active:translate-y-0 active:scale-[0.98]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[8px]',
  md: 'h-9.5 px-4 text-[13.5px] gap-2 rounded-[9px]',
  lg: 'h-11 px-5 text-[14px] gap-2 rounded-[11px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      full,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'group relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-[220ms] ease-out will-change-transform disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0',
          variantStyles[variant],
          sizeStyles[size],
          full && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
        {children}
        {variant === 'primary' && !loading && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-[650ms] ease-out group-hover:left-full" />
          </span>
        )}
      </button>
    )
  },
)
