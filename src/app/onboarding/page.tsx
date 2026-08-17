'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  MessagesSquare,
  Store,
  Check,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Magnetic } from '@/components/ui/Magnetic'
import { BrandMark } from '@/components/ui/Logo'
import { AnimatedBackground } from '@/components/background/AnimatedBackground'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'
import { EASE_STANDARD, staggerContainer, staggerItem } from '@/components/motion/variants'

const businessTypes = [
  { value: 'FREELANCER', label: 'Freelancer', icon: User, hint: 'Solo work, one invoice at a time' },
  { value: 'AGENCY', label: 'Agency', icon: Building2, hint: 'A team juggling many clients' },
  { value: 'CONSULTANT', label: 'Consultant', icon: MessagesSquare, hint: 'Advice and billable hours' },
  { value: 'SMALL_BUSINESS', label: 'Small business', icon: Store, hint: 'Products, people, and admin' },
  { value: 'OTHER', label: 'Something else', icon: Sparkles, hint: 'We’ll figure it out together' },
]

const steps = ['Workspace', 'Business', 'Launch']

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessTypeCustom, setBusinessTypeCustom] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  // Redirect to login if session is confirmed as unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  const goNext = () => {
    if (step === 0) {
      if (!name.trim()) return setError('Give your workspace a name.')
      setError(undefined)
      setStep(1)
    } else {
      if (!businessType) return setError('Pick the option that fits best.')
      if (businessType === 'OTHER' && !businessTypeCustom.trim()) {
        return setError('Tell us what you do.')
      }
      setError(undefined)
      setStep(2)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!businessType) return setError('Pick the option that fits best.')
    if (businessType === 'OTHER' && !businessTypeCustom.trim()) {
      return setError('Tell us what you do.')
    }
    setError(undefined)
    setLoading(true)
    try {
      await apiPost('/api/onboarding', {
        name: name.trim(),
        businessType,
        ...(businessType === 'OTHER' ? { businessTypeCustom: businessTypeCustom.trim() } : {}),
      })
      toast({ kind: 'success', title: 'Workspace ready', message: "Let's set up your business." })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Could not create your workspace.'
      setError(message)
      toast({ kind: 'warning', title: 'Could not create workspace', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-14">
      <AnimatedBackground variant="cinematic" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_STANDARD }}
        className="relative w-full max-w-[460px]"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5"
          >
            <BrandMark size={40} />
            <span className="text-[19px] font-semibold tracking-[0.2em] text-fg">VANTA</span>          </motion.div>

          <div className="mx-auto mt-7 flex max-w-[240px] items-center">
            {steps.map((label, i) => {
              const active = i === step
              const done = i < step
              return (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.span
                      animate={{
                        backgroundColor: done || active ? '#8b5cf6' : 'rgba(255,255,255,0.09)',
                        color: done || active ? '#ffffff' : '#a6a6b0',
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex size-6 items-center justify-center rounded-full text-[11px] font-semibold"
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </motion.span>
                    <span
                      className={`text-[10px] font-medium uppercase tracking-[0.14em] ${
                        active ? 'text-violet' : 'text-fg-3'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="relative mx-2 mb-4 h-px flex-1 overflow-hidden rounded-full bg-line-strong">
                      <motion.div
                        animate={{ scaleX: done ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: EASE_STANDARD }}
                        className="absolute inset-0 origin-left bg-violet"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE_STANDARD }}
            >
              {step === 0 && (
                <>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-violet/25 bg-violet/[0.08] px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-violet-bright">
                    <Sparkles size={10} />
                    One more step
                  </span>
                  <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.02em] text-fg">
                    Name your workspace
                  </h1>
                  <p className="mt-1 text-[13.5px] text-fg-3">
                    This is your private command center. You can change it later.
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em] text-fg">
                    What best describes you?
                  </h1>
                  <p className="mt-1 text-[13.5px] text-fg-3">
                    We tailor VANTA’s defaults to how you actually work.
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em] text-fg">
                    Ready to launch
                  </h1>
                  <p className="mt-1 text-[13.5px] text-fg-3">
                    Review your setup, then we’ll build your workspace.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE_STANDARD }}
            className="rounded-[var(--radius-panel)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
          >
            {step === 0 && (
              <form onSubmit={(e) => { e.preventDefault(); goNext() }} noValidate className="space-y-4">
                <Input
                  label="Business name"
                  placeholder="e.g. Northwind Studio"
                  autoComplete="organization"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError(undefined)
                  }}
                  error={error}
                  icon={<Building2 size={15} />}
                />
                <Magnetic className="w-full">
                  <Button type="submit" size="lg" full className="group">
                    Continue
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
                    />
                  </Button>
                </Magnetic>
              </form>
            )}

            {step === 1 && (
              <motion.div
                variants={staggerContainer(0.05)}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {businessTypes.map((t) => {
                  const Icon = t.icon
                  const selected = businessType === t.value
                  return (
                    <motion.button
                      key={t.value}
                      type="button"
                      variants={staggerItem}
                      onClick={() => {
                        setBusinessType(t.value)
                        if (error) setError(undefined)
                      }}
                      className={`group flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-all duration-[220ms] ease-out ${
                        selected
                          ? 'border-violet/60 bg-violet/[0.08] shadow-[0_0_0_3px_rgba(139,92,246,0.14)]'
                          : 'border-line bg-canvas/40 hover:border-line-strong hover:bg-hover'
                      }`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-[220ms] ease-out ${
                          selected ? 'bg-violet text-white' : 'bg-white/[0.06] text-fg-2 group-hover:text-fg'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] font-medium ${selected ? 'text-fg' : 'text-fg'}`}>
                          {t.label}
                        </span>
                        <span className="block text-[12px] text-fg-3">{t.hint}</span>
                      </span>
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-[220ms] ease-out ${
                          selected ? 'border-violet bg-violet text-white' : 'border-line-strong'
                        }`}
                      >
                        {selected && <Check size={11} strokeWidth={3.2} />}
                      </span>
                    </motion.button>
                  )
                })}

                <AnimatePresence>
                  {businessType === 'OTHER' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: EASE_STANDARD }}
                      className="overflow-hidden"
                    >
                      <Input
                        label="What do you do?"
                        placeholder="e.g. Developer, Architect, Photographer, Contractor..."
                        autoFocus
                        value={businessTypeCustom}
                        onChange={(e) => {
                          setBusinessTypeCustom(e.target.value)
                          if (error) setError(undefined)
                        }}
                        error={businessType === 'OTHER' && error && !businessTypeCustom.trim() ? error : undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && businessType !== 'OTHER' && (
                  <p className="animate-[error-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both] text-[12.5px] text-danger">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-fg"
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                  <Button
                    type="button"
                    size="md"
                    onClick={goNext}
                    disabled={!businessType || (businessType === 'OTHER' && !businessTypeCustom.trim())}
                  >
                    Continue
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-3 rounded-[12px] border border-line bg-canvas/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-fg-3">Workspace</span>
                    <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                      <Building2 size={14} className="text-violet-bright" />
                      {name.trim()}
                    </span>
                  </div>
                  <div className="h-px bg-line" />
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-fg-3">Business type</span>
                    <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                      <LayoutDashboard size={14} className="text-violet-bright" />
                      {businessType === 'OTHER'
                        ? businessTypeCustom.trim()
                        : businessTypes.find((t) => t.value === businessType)?.label}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="animate-[error-in_0.28s_cubic-bezier(0.16,1,0.3,1)_both] text-[12.5px] text-danger">
                    {error}
                  </p>
                )}

                <Magnetic className="w-full">
                  <Button
                    type="submit"
                    size="lg"
                    full
                    loading={loading || status === 'loading'}
                    disabled={loading || status === 'loading'}
                    className="group"
                  >
                    {status === 'loading' ? (
                      'Preparing workspace...'
                    ) : !loading ? (
                      <>
                        Create workspace
                        <ArrowRight
                          size={15}
                          className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
                        />
                      </>
                    ) : null}
                  </Button>
                </Magnetic>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mx-auto flex items-center gap-1.5 text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-fg"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center text-[12px] text-fg-3"
        >
          Everything lives in one secure workspace. Skip ahead anytime.
        </motion.p>
      </motion.div>
    </div>
  )
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new ApiClientError(data.error ?? { code: 'UNKNOWN', message: 'Request failed.' }, res.status)
  }
  return data.data
}
