'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { NovaMark } from '@/components/ui/Logo'

export function AuthLayout({
  children,
  headline,
  subline,
}: {
  children: React.ReactNode
  headline: string
  subline: string
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-line bg-canvas-deep lg:block">
        <GeometricBackdrop />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-14">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <NovaMark size={34} />
            <span className="text-[17px] font-semibold tracking-[0.2em] text-fg">NOVA</span>
          </motion.div>

          <div className="max-w-lg pb-[10vh]">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold"
            >
              <Sparkles size={11} />
              AI Business Command Center
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-balance text-[40px] font-semibold leading-[1.08] tracking-[-0.025em] text-fg xl:text-[48px]"
            >
              Run your business.
              <br />
              <span className="text-fg-3">Not your spreadsheets.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-5 max-w-sm text-[15px] leading-relaxed text-fg-2"
            >
              One intelligent workspace for clients, projects, payments, and
              everything in between.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex items-center gap-6 text-[11.5px] text-fg-3"
          >
            <span>Trusted by independent businesses</span>
            <span className="h-3 w-px bg-line-strong" />
            <span>Invoices, tasks &amp; AI in one place</span>
          </motion.div>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-canvas px-6 py-14 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-9 lg:mb-11">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5"
            >
              <NovaMark size={40} />
              <span className="text-[19px] font-semibold tracking-[0.2em] text-fg">NOVA</span>
            </motion.div>
            <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.02em] text-fg">{headline}</h2>
            <p className="mt-1 text-[13.5px] text-fg-3">{subline}</p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  )
}

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GeometricBackdrop() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 600px at 20% 0%, rgba(201,168,108,0.05), transparent 60%), radial-gradient(800px 600px at 90% 90%, rgba(52,211,153,0.04), transparent 55%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 640 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
          <path d="M0 320 L640 180" />
          <path d="M0 560 L640 420" />
          <path d="M0 720 L640 640" />
          <path d="M180 0 L320 900" />
          <path d="M470 0 L420 900" />
        </g>
        <g stroke="rgba(201,168,108,0.16)" strokeWidth="1">
          <path d="M0 420 L640 300" />
        </g>
        <g fill="rgba(255,255,255,0.5)">
          <circle cx="320" cy="180" r="2.5" />
          <circle cx="420" cy="420" r="2" />
          <circle cx="180" cy="560" r="2.5" />
        </g>
        <g fill="#C9A86C">
          <circle cx="470" cy="300" r="2" />
        </g>
        <g fill="#34D399">
          <circle cx="210" cy="300" r="2" />
        </g>
      </svg>
      <div
        className="dot-grid absolute inset-0 opacity-40"
        style={{
          maskImage: 'radial-gradient(700px 500px at 35% 25%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(700px 500px at 35% 25%, black, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-transparent to-canvas-deep/50" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-canvas-deep/90 to-transparent" />
    </div>
  )
}
