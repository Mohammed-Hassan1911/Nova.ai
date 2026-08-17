'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/ui/Logo'
import { AnimatedBackground } from '@/components/background/AnimatedBackground'
import { EASE_OUT, EASE_STANDARD } from '@/components/motion/variants'
import { cn } from '@/lib/utils'

const metrics = [
  { title: 'Clients managed', subtitle: 'All in one place' },
  { title: 'Invoices & payments', subtitle: 'Streamlined' },
  { title: 'AI business tools', subtitle: 'Built into your workspace' },
]

const heroLines = [
  <>Run your business.</>,
  <>
    <span className="text-gradient">Not your spreadsheets.</span>
  </>,
]

const signupLines = [
  <>Your entire business,</>,
  <>
    <span className="text-gradient">one command center.</span>
  </>,
]

export function AuthLayout({
  children,
  headline,
  subline,
  variant = 'login',
}: {
  children: React.ReactNode
  headline: string
  subline: string
  variant?: 'login' | 'signup'
}) {
  const centered = variant === 'signup'
  const lines = centered ? signupLines : heroLines

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="cinematic" />

      {centered ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-14 sm:px-10">
          <div className="w-full max-w-[430px]">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mb-10 flex justify-center"
            >
              <div className="flex items-center gap-2.5">
                <BrandMark size={36} />
                <span className="text-[18px] font-semibold tracking-[0.22em] text-fg">VANTA</span>
              </div>
            </motion.div>

            <GlassPanel headline={headline} subline={subline}>
              {children}
            </GlassPanel>
          </div>
        </div>
      ) : (
        <div className="grid min-h-screen lg:grid-cols-[1.14fr_0.86fr]">
          <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex xl:p-14">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="flex items-center gap-3"
            >
              <BrandMark size={34} />
              <span className="text-[17px] font-semibold tracking-[0.22em] text-fg">VANTA</span>
            </motion.div>

            <div className="max-w-xl pb-[6vh]">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.55, ease: EASE_OUT }}
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet/25 bg-violet/[0.08] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-bright"
              >
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-bright opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-violet-bright" />
                </span>
                <Sparkles size={11} />
                AI Business Command Center
              </motion.div>

              <h1 className="text-[44px] font-semibold leading-[1.06] tracking-[-0.03em] text-fg xl:text-[54px]">
                {lines.map((line, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.2 + i * 0.14, duration: 0.7, ease: EASE_STANDARD }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.55, ease: EASE_OUT }}
                className="mt-6 max-w-md text-[15px] leading-relaxed text-fg-2"
              >
                One intelligent workspace for clients, projects, payments, and
                everything in between.
              </motion.p>

              <motion.dl
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62, duration: 0.55, ease: EASE_OUT }}
                className="mt-12 grid grid-cols-3 gap-5 border-t border-line pt-7"
              >
                {metrics.map((m) => (
                  <div key={m.subtitle}>
                    <dt className="order-2 mt-1 text-[11px] leading-snug text-fg-3">{m.subtitle}</dt>
                    <dd className="order-1 text-[22px] font-semibold tracking-[-0.02em] text-fg">
                      {m.title}
                    </dd>
                  </div>
                ))}
              </motion.dl>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.7 }}
              className="flex items-center gap-6 text-[11.5px] text-fg-3"
            >
              <span>Trusted by independent businesses</span>
              <span className="h-3 w-px bg-line-strong" />
              <span>Invoices, tasks &amp; AI in one place</span>
            </motion.div>
          </div>

          <div className="relative z-10 flex items-center justify-center px-6 py-14 sm:px-10">
            <div className="w-full max-w-[400px]">
              <div className="mb-9 flex items-center gap-2.5 lg:hidden">
                <BrandMark size={32} />
                <span className="text-[17px] font-semibold tracking-[0.22em] text-fg">VANTA</span>
              </div>
              <GlassPanel headline={headline} subline={subline}>
                {children}
              </GlassPanel>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GlassPanel({
  headline,
  subline,
  children,
}: {
  headline: string
  subline: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: EASE_STANDARD, delay: 0.1 }}
      className="relative"
    >
      <div className="pointer-events-none absolute -inset-px rounded-[24px] bg-gradient-to-b from-violet/20 via-transparent to-cyan/10 opacity-70" />
      <div className="panel-hairline-accent glass-strong relative rounded-[24px] p-8 sm:p-9">
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: EASE_OUT }}
            className="text-[26px] font-semibold tracking-[-0.02em] text-fg"
          >
            {headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
            className="mt-1.5 text-[13.5px] text-fg-3"
          >
            {subline}
          </motion.p>
        </div>
        {children}
      </div>
    </motion.div>
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
