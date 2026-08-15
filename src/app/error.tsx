'use client'

import { useEffect } from 'react'
import { NovaMark } from '@/components/ui/Logo'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="dot-grid relative flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-14 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-gold/[0.04] to-transparent" />

      <NovaMark size={40} />

      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
        Something went wrong
      </p>
      <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-fg lg:text-[34px]">
        The system hit an unexpected error
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-fg-3">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-gold px-5 text-[13.5px] font-medium text-[#16130b] transition-all duration-200 hover:bg-gold-bright active:scale-[0.99]"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-line bg-surface px-5 text-[13.5px] font-medium text-fg-2 transition-colors duration-150 hover:border-line-strong hover:text-fg"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  )
}
