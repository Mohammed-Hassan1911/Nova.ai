'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Magnetic } from '@/components/ui/Magnetic'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'
import { StaggerGroup } from '@/components/motion/Stagger'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return setError('This reset link is missing its token. Request a new one.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setError(undefined)
    setLoading(true)
    try {
      await apiPost('/api/auth/reset-password', { token, password })
      setDone(true)
      toast({ kind: 'success', title: 'Password updated', message: 'Sign in with your new password.' })
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Something went wrong. Try again.'
      setError(message)
      toast({ kind: 'warning', title: 'Could not reset password', message })
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-[12px] border border-emerald/25 bg-emerald/[0.07] px-4 py-5 text-center">
        <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald/15 text-emerald">
          <Check size={18} strokeWidth={2.4} />
        </span>
        <p className="text-[14px] font-medium text-fg">Password updated</p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-violet-bright transition-colors hover:text-violet"
        >
          <ArrowLeft size={13} />
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StaggerGroup className="space-y-4" stagger={0.08} delayChildren={0.32}>
        <Input
          label="New password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        floating
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          if (error) setError(undefined)
        }}
        error={error}
        icon={<Lock size={15} />}
      />
      <Input
        label="Confirm password"
        type="password"
        placeholder="Repeat your password"
        autoComplete="new-password"
        floating
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value)
          if (error) setError(undefined)
        }}
        icon={<Lock size={15} />}
      />
      <Magnetic className="w-full">
        <Button type="submit" size="lg" full loading={loading}>
          {!loading && 'Update password'}
        </Button>
      </Magnetic>
      </StaggerGroup>
    </form>
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

export default function ResetPasswordPage() {
  return (
    <AuthLayout headline="Set a new password" subline="Choose a strong password for your account.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  )
}
