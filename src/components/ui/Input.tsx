import { forwardRef, useCallback, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  trailing?: ReactNode
  hint?: string
  wrapperClassName?: string
  floating?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, label, error, icon, trailing, hint, wrapperClassName, floating, ...props },
    ref,
  ) {
    if (floating) {
      return <FloatingInput {...props} label={label} error={error} icon={icon} trailing={trailing} hint={hint} ref={ref} className={className} wrapperClassName={wrapperClassName} />
    }

    return (
      <label className={cn('block', wrapperClassName)}>
        {label && (
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">
            {label}
          </span>
        )}
        <div className="group relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3 transition-colors duration-[220ms] ease-out group-focus-within:text-violet">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface-2/60 px-3.5 text-[14px] text-fg shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] placeholder:text-fg-3/70 transition-all duration-[220ms] ease-out hover:border-line-strong focus:border-violet/60 focus:bg-surface-2 focus:shadow-[var(--shadow-focus)]',
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
          <span className="mt-1.5 block animate-[error-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both] text-[12.5px] text-danger">
            {error}
          </span>
        ) : hint ? (
          <span className="mt-1.5 block text-[12px] text-fg-3">{hint}</span>
        ) : null}
      </label>
    )
  },
)

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  icon?: ReactNode
  trailing?: ReactNode
  hint?: string
  wrapperClassName?: string
  className?: string
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  function FloatingInput(
    { className, label, error, icon, trailing, hint, wrapperClassName, ...props },
    ref,
  ) {
    const [focused, setFocused] = useState(false)
    const filled = props.value !== undefined ? !!props.value : !!props.defaultValue
    const raised = focused || filled

    const onFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true)
        props.onFocus?.(e)
      },
      [props],
    )
    const onBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false)
        props.onBlur?.(e)
      },
      [props],
    )

    return (
      <div className={cn('relative', wrapperClassName)}>
        <input
          ref={ref}
          {...props}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={label}
          aria-invalid={!!error}
          className={cn(
            'h-12 w-full rounded-[var(--radius-input)] border border-line bg-surface px-3.5 pb-1.5 pt-5 text-[14px] text-fg shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-[220ms] ease-out hover:border-line-strong focus:border-violet/60 focus:bg-surface-2 focus:shadow-[var(--shadow-focus)]',
            // The label acts as the placeholder while idle; only reveal the
            // real placeholder once the label has floated up.
            raised ? 'placeholder:text-fg-3/45' : 'placeholder:text-transparent',
            icon && 'pl-10',
            trailing && 'pr-11',
            error &&
              'border-danger/45 focus:border-danger/55 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.12)]',
            className,
          )}
        />
        {icon && (
          <span
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-[220ms] ease-out',
              focused ? 'text-violet' : filled ? 'text-fg-3' : 'text-fg-3',
            )}
          >
            {icon}
          </span>
        )}
        {label && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-3.5 origin-left transition-all duration-[220ms] ease-out',
              raised
                ? 'top-[7px] translate-y-0 scale-[0.76]'
                : 'top-1/2 -translate-y-1/2 scale-100',
              raised
                ? focused
                  ? 'text-violet-bright'
                  : 'text-fg-2'
                : 'text-fg-3',
              icon && 'left-10',
            )}
          >
            {label}
          </span>
        )}
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
        {error ? (
          <span
            role="alert"
            className="mt-1.5 block animate-[error-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both] text-[12.5px] text-danger"
          >
            {error}
          </span>
        ) : hint ? (
          <span className="mt-1.5 block text-[12px] text-fg-3">{hint}</span>
        ) : null}
      </div>
    )
  },
)
