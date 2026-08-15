import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  trailing?: ReactNode
  hint?: string
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, label, error, icon, trailing, hint, wrapperClassName, ...props },
    ref,
  ) {
    return (
      <label className={cn('block', wrapperClassName)}>
        {label && (
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">
            {label}
          </span>
        )}
        <div className="group relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3 transition-colors duration-150 group-focus-within:text-fg-2">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3.5 text-[14px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:bg-surface-2 focus:shadow-[var(--shadow-focus)]',
              icon && 'pl-10',
              trailing && 'pr-11',
              error &&
                'border-danger/45 focus:border-danger/55 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.12)]',
              className,
            )}
            {...props}
          />
          {trailing && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
          )}
        </div>
        {error ? (
          <span className="mt-1.5 block text-[12.5px] text-danger">{error}</span>
        ) : hint ? (
          <span className="mt-1.5 block text-[12px] text-fg-3">{hint}</span>
        ) : null}
      </label>
    )
  },
)
