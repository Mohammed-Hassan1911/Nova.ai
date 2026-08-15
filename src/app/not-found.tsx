import Link from 'next/link'
import { NovaMark } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <div className="dot-grid relative flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-14 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-gold/[0.04] to-transparent" />

      <Link href="/dashboard" className="inline-flex items-center gap-2.5">
        <NovaMark size={40} />
        <span className="text-[19px] font-semibold tracking-[0.2em] text-fg">NOVA</span>
      </Link>

      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">404</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] text-fg lg:text-[40px]">
        This page drifted off the grid
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-fg-3">
        The page you&apos;re looking for doesn&apos;t exist, was moved, or never made it out of the
        backlog.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-gold px-5 text-[13.5px] font-medium text-[#16130b] transition-all duration-200 hover:bg-gold-bright active:scale-[0.99]"
        >
          Back to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-[10px] border border-line bg-surface px-5 text-[13.5px] font-medium text-fg-2 transition-colors duration-150 hover:border-line-strong hover:text-fg"
        >
          Home
        </Link>
      </div>
    </div>
  )
}
