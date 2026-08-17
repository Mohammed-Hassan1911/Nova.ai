'use client'

import { useCallback, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

const LENGTH = 6

interface VerificationCodeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  autoFocus?: boolean
}

export function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  error,
  autoFocus = true,
}: VerificationCodeInputProps) {
  const digits = value.split('')
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const focusInput = useCallback(
    (index: number) => {
      const input = inputsRef.current[index]
      if (input) {
        input.focus()
        input.select()
      }
    },
    [],
  )

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (disabled) return

      // Only accept digits
      const d = digit.replace(/\D/g, '').slice(-1)
      const next = digits.slice()
      next[index] = d
      const nextValue = next.join('')
      onChange(nextValue)

      // Auto-advance to next input
      if (d && index < LENGTH - 1) {
        focusInput(index + 1)
      }
    },
    [disabled, digits, onChange, focusInput],
  )

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        if (digits[index]) {
          // Clear current digit
          const next = digits.slice()
          next[index] = ''
          onChange(next.join(''))
        } else if (index > 0) {
          // Move back and clear previous
          const next = digits.slice()
          next[index - 1] = ''
          onChange(next.join(''))
          focusInput(index - 1)
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault()
        focusInput(index - 1)
      } else if (e.key === 'ArrowRight' && index < LENGTH - 1) {
        e.preventDefault()
        focusInput(index + 1)
      }
    },
    [disabled, digits, onChange, focusInput],
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return
      e.preventDefault()

      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
      if (pasted) {
        onChange(pasted)
        // Focus the next empty input or the last one
        const nextIndex = Math.min(pasted.length, LENGTH - 1)
        focusInput(nextIndex)
      }
    },
    [disabled, onChange, focusInput],
  )

  const handleFocus = useCallback(
    (index: number) => {
      // Select all text on focus for easy replacement
      inputsRef.current[index]?.select()
    },
    [],
  )

  return (
    <div>
      <div className="flex justify-center gap-3">
        {Array.from({ length: LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digits[i] ?? ''}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(i)}
            className={cn(
              'h-14 w-12 text-center text-[22px] font-semibold tracking-wide text-fg',
              'rounded-[10px] border bg-surface-2/60 transition-all duration-200',
              'shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]',
              'placeholder:text-fg-3/40',
              'focus:outline-none focus:border-violet/60 focus:shadow-[var(--shadow-focus)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              digits[i]
                ? 'border-violet/40 bg-surface-2'
                : error
                  ? 'border-danger/45'
                  : 'border-line hover:border-line-strong',
            )}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 text-center text-[13px] text-danger animate-[error-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both]">
          {error}
        </p>
      )}
    </div>
  )
}
