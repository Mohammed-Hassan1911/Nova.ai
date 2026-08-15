'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return setError('Email is required.')
    if (!emailPattern.test(email)) return setError('Enter a valid email address.')
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
        <div className="rounded-[12px] border border-emerald/25 bg-emerald/[0.07] px-4 py-5 text-center">
          <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald/15 text-emerald">
            <Check size={18} strokeWidth={2.4} />
          </span>
          <p className="text-[14px] font-medium text-fg">Check your inbox</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-fg-3">
            If an account exists for <span className="text-fg-2">{email}</span>, a reset link is on
            its way. It expires in one hour.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-gold transition-colors hover:text-gold-bright"
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(undefined)
            }}
            error={error}
            icon={<Mail size={15} />}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-[10px] bg-gold text-[14px] font-medium text-[#16130b] transition-all duration-200 hover:bg-gold-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 text-center text-[13px] text-fg-3"
      >
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-fg transition-colors duration-150 hover:text-gold">
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </motion.p>
    </AuthLayout>
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
