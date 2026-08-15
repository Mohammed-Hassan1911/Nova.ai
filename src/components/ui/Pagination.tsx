'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface PaginationProps {
  page: number
  pages: number
  onPrev: () => void
  onNext: () => void
  disabled?: boolean
}

export function PaginationBar({ page, pages, onPrev, onNext, disabled }: PaginationProps) {
  const clamped = Math.max(1, pages)
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
      <p className="text-[12.5px] text-fg-3">
        Page {page} of {clamped}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={disabled || page <= 1}>
          <ChevronLeft size={14} strokeWidth={2.2} />
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={onNext} disabled={disabled || page >= clamped}>
          Next
          <ChevronRight size={14} strokeWidth={2.2} />
        </Button>
      </div>
    </div>
  )
}
