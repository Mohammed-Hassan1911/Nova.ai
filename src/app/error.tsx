'use client'

import { useEffect } from 'react'
import { BrandMark } from '@/components/ui/Logo'

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-violet/[0.04] to-transparent" />

      <BrandMark size={40} />

      <p className="mt-10 animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.15s_both] text-[11px] font-semibold uppercase tracking-[0.3em] text-violet">
        Something went wrong
      </p>
      <h1 className="mt-3 animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.22s_both] text-[28px] font-semibold tracking-[-0.02em] text-fg lg:text-[34px]">
        The system hit an unexpected error
      </h1>
      <p className="mt-3 max-w-md animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] text-[14px] leading-relaxed text-fg-3">
        An unexpected error occurred while rendering this page. Your work is safe — please try again.
      </p>

      <div className="mt-8 flex animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.38s_both] items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-violet px-5 text-[13.5px] font-medium text-white transition-all duration-[220ms] ease-out hover:-translate-y-px hover:bg-violet-bright active:translate-y-0 active:scale-[0.99]"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-line bg-surface px-5 text-[13.5px] font-medium text-fg-2 transition-all duration-[220ms] ease-out hover:-translate-y-px hover:border-line-strong hover:text-fg active:translate-y-0"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  )
}
