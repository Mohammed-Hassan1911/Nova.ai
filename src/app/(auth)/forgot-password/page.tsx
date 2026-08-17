'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Magnetic } from '@/components/ui/Magnetic'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'
import { StaggerGroup } from '@/components/motion/Stagger'
import { EASE_OUT } from '@/components/motion/variants'
import { validateEmail } from '@/lib/validation/validate'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return setError('Email is required.')
    const emailErr = validateEmail(email)
    if (emailErr) return setError(emailErr)
    setError(undefined)
    setLoading(true)
    try {
      await apiPost('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Something went wrong. Try again.'
      toast({ kind: 'warning', title: 'Could not send reset email', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout headline="Reset your password" subline="We'll email you a secure reset link.">
      {sent ? (
        <SentState email={email} />
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <StaggerGroup className="space-y-4" stagger={0.08} delayChildren={0.32}>
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              floating
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(undefined)
              }}
              error={error}
              icon={<Mail size={15} />}
            />
            <Magnetic className="w-full">
              <Button type="submit" size="lg" full loading={loading}>
                {!loading && 'Send reset link'}
              </Button>
            </Magnetic>
          </StaggerGroup>
        </form>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 text-center text-[13px] text-fg-3"
      >
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-fg transition-colors duration-150 hover:text-violet-bright">
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </motion.p>
    </AuthLayout>
  )
}

function SentState({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="panel-hairline relative overflow-hidden rounded-[14px] border border-emerald/25 bg-emerald/[0.05] px-4 py-6 text-center"
    >
      <div className="relative mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-emerald/30 bg-emerald/[0.09] text-emerald">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="absolute inset-0 rounded-full border border-emerald/40"
        />
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 }}
        >
          <motion.path
            d="M4 6.2 10 11l6-4.8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.2 }}
          />
        </motion.svg>
      </div>
      <p className="text-[14px] font-medium text-fg">Check your inbox</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-fg-3">
        If an account exists for <span className="text-fg-2">{email}</span>, a reset link is on its
        way. It expires in one hour.
      </p>
      <Link
        href="/login"
        className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-violet-bright transition-colors hover:text-violet"
      >
        <ArrowLeft size={13} />
        Back to sign in
      </Link>
    </motion.div>
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
