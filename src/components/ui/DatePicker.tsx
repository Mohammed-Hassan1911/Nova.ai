'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/components/motion/variants'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromYmd(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatDisplay(s: string): string {
  const d = fromYmd(s)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, label, error, placeholder, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const initial = fromYmd(value) ?? new Date()
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const [viewYear, setViewYear] = useState(initial.getFullYear())

  useEffect(() => {
    if (open) {
      const d = fromYmd(value) ?? new Date()
      setViewMonth(d.getMonth())
      setViewYear(d.getFullYear())
    }
  }, [open, value])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  const today = new Date()
  const todayYmd = toYmd(today)
  const selectedYmd = value

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const selectDay = (day: number) => {
    const ymd = toYmd(new Date(viewYear, viewMonth, day))
    onChange(ymd)
    setOpen(false)
  }

  const panelPosition = (() => {
    if (!triggerRef.current) return { top: 0, left: 0 }
    const rect = triggerRef.current.getBoundingClientRect()
    return { top: rect.bottom + 6, left: rect.left }
  })()

  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">{label}</span>
      )}
      <div ref={triggerRef} className="relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen((o) => !o)
            }
          }}
          className={cn(
            'flex h-10 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-input)] border bg-surface-2/60 px-3.5 text-[14px] text-fg shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-[220ms] ease-out hover:border-line-strong',
            open ? 'border-violet/60 bg-surface-2 shadow-[var(--shadow-focus)]' : 'border-line',
            error && 'border-danger/45',
          )}
        >
          <Calendar size={14} className="shrink-0 text-fg-3" />
          <span className={cn('flex-1 truncate', !value && 'text-fg-3/70')}>
            {value ? formatDisplay(value) : (placeholder ?? 'Pick a date')}
          </span>
        </div>
        {error && (
          <span className="mt-1.5 block animate-[error-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both] text-[12.5px] text-danger">
            {error}
          </span>
        )}
      </div>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: panelPosition.top,
              left: panelPosition.left,
              zIndex: 100,
            }}
            className="w-[280px] overflow-hidden rounded-[var(--radius-input)] border border-line-strong bg-surface shadow-[var(--shadow-pop)] backdrop-blur-[12px]"
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-md text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[13px] font-medium text-fg">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-md text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-px px-3 pb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 text-center text-[11px] font-medium text-fg-3">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px px-3 pb-3">
              {days.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />
                const ymd = toYmd(new Date(viewYear, viewMonth, day))
                const isSelected = ymd === selectedYmd
                const isToday = ymd === todayYmd
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      'relative flex h-8 w-full items-center justify-center rounded-md text-[13px] transition-all duration-[150ms] ease-out',
                      isSelected
                        ? 'bg-violet text-white font-medium'
                        : isToday
                          ? 'text-violet-bright font-medium'
                          : 'text-fg hover:bg-hover',
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </label>
  )
}
