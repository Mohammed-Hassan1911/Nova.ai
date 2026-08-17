import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, label, error, children, ...props }, ref) {
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">
            {label}
          </span>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'h-10 w-full appearance-none rounded-[var(--radius-input)] border border-line bg-surface-2/60 px-3.5 pr-9 text-[14px] text-fg shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-[220ms] ease-out hover:border-line-strong focus:border-violet/60 focus:bg-surface-2 focus:shadow-[var(--shadow-focus)]',
              'cursor-pointer [&>option]:bg-surface [&>option]:text-fg',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3"
          />
        </div>
        {error && <span className="mt-1.5 block text-[12.5px] text-danger">{error}</span>}
      </label>
    )
  },
)
