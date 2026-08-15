import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
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
    'bg-gold text-[#16130b] font-medium shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_6px_20px_-8px_rgba(201,168,108,0.4)] hover:bg-gold-bright hover:shadow-[0_1px_0_rgba(255,255,255,0.26)_inset,0_8px_24px_-8px_rgba(201,168,108,0.5)] active:scale-[0.985] active:brightness-95',
  secondary:
    'border border-line-strong bg-surface-2 text-fg hover:bg-pressed hover:border-white/20 active:scale-[0.985]',
  ghost: 'text-fg-2 hover:bg-hover hover:text-fg',
  danger:
    'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.985]',
  success:
    'border border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20 active:scale-[0.985]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[7px]',
  md: 'h-9.5 px-4 text-[13.5px] gap-2 rounded-[8px]',
  lg: 'h-11 px-5 text-[14px] gap-2 rounded-[10px]',
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
          'relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 will-change-transform disabled:pointer-events-none disabled:opacity-45',
          variantStyles[variant],
          sizeStyles[size],
          full && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
        {children}
      </button>
    )
  },
)
