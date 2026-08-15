'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!name.trim()) nextErrors.name = 'Please enter your name.'
    if (!email) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await apiPost('/api/auth/register', { name: name.trim(), email, password })
      toast({ kind: 'success', title: 'Account created', message: 'Welcome to NOVA.' })
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) throw new Error('auto sign-in failed')
      router.push('/onboarding')
      router.refresh()
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Could not create your account. Try again.'
      toast({ kind: 'warning', title: 'Sign up failed', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Full name"
        placeholder="Ada Lovelace"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
        }}
        error={errors.name}
        icon={<User size={15} />}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
        }}
        error={errors.email}
        icon={<Mail size={15} />}
      />
      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
        }}
        error={errors.password}
        icon={<Lock size={15} />}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="flex size-7 items-center justify-center rounded-[6px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg-2"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />

      <button
        type="submit"
        disabled={loading}
        className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-[10px] bg-gold text-[14px] font-medium text-[#16130b] transition-all duration-200 hover:bg-gold-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        <span className="relative flex items-center gap-2">
          {loading ? 'Creating account…' : (
            <>
              Create account
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </button>

      <div className="flex items-center gap-4 py-0.5">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-fg-3">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {googleEnabled ? (
        <Button type="button" variant="secondary" size="lg" full onClick={() => signIn('google', { callbackUrl: '/onboarding' })}>
          <GoogleIcon />
          Continue with Google
        </Button>
      ) : null}
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

export default function SignupPage() {
  return (
    <AuthLayout headline="Create your account" subline="Set up your AI business workspace.">
      <Suspense>
        <SignupForm />
      </Suspense>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 text-center text-[13px] text-fg-3"
      >
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-fg transition-colors duration-150 hover:text-gold">
          Sign in
        </Link>
      </motion.p>
    </AuthLayout>
  )
}
