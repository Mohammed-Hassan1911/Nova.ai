'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Magnetic } from '@/components/ui/Magnetic'
import { StaggerGroup } from '@/components/motion/Stagger'
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'
import { validatePassword, validateEmail } from '@/lib/validation/validate'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!email.trim()) {
      nextErrors.identifier = 'Email is required.'
    } else {
      const emailErr = validateEmail(email)
      if (emailErr) nextErrors.identifier = emailErr
    }
    const pwErr = validatePassword(password)
    if (pwErr) nextErrors.password = pwErr
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // First check credentials + verification status via our endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim(), password }),
      })
      const data = await res.json()

      if (!data.success) {
        throw new ApiClientError(data.error ?? { code: 'LOGIN_FAILED', message: 'Invalid credentials.' }, res.status)
      }

      // If not verified, redirect to verification page
      if (data.data && !data.data.verified) {
        // Store password in sessionStorage (not URL params) for security
        sessionStorage.setItem(`verify_pwd_${data.data.userId}`, password)
        const params = new URLSearchParams({
          userId: data.data.userId,
          method: data.data.method,
          destination: data.data.destination,
        })
        router.push(`/verify?${params.toString()}`)
        return
      }

      // Verified — create session via NextAuth
      const signInResult = await signIn('credentials', {
        identifier: email.trim(),
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast({ kind: 'warning', title: 'Could not sign in', message: 'Check your credentials and try again.' })
      } else {
        router.push(next)
        router.refresh()
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'NOT_VERIFIED') {
        const fields = err.fields as Record<string, string> | undefined
        if (fields) {
          sessionStorage.setItem(`verify_pwd_${fields.userId ?? ''}`, password)
          const params = new URLSearchParams({
            userId: fields.userId ?? '',
            method: fields.method ?? 'EMAIL',
            destination: fields.destination ?? '',
          })
          router.push(`/verify?${params.toString()}`)
          return
        }
      }
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Something went wrong. Try again.'
      toast({ kind: 'warning', title: 'Could not sign in', message })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    signIn('google', { callbackUrl: next })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StaggerGroup className="space-y-4" stagger={0.08} delayChildren={0.32}>
        <Input
          label="Email"
          placeholder="you@company.com"
          autoComplete="username webauthn"
          floating
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.identifier) setErrors((p) => ({ ...p, identifier: undefined }))
          }}
          error={errors.identifier}
          icon={<Mail size={15} />}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          autoComplete="current-password"
          floating
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

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="link-underline text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-violet-bright"
          >
            Forgot password?
          </Link>
        </div>

        <Magnetic className="w-full">
          <Button type="submit" size="lg" full loading={loading} className="group">
            {!loading && (
              <>
                Sign in
                <ArrowRight
                  size={15}
                  className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
                />
              </>
            )}
          </Button>
        </Magnetic>

        <div className="flex items-center gap-4 py-0.5">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-fg-3">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {googleEnabled ? (
          <Button type="button" variant="secondary" size="lg" full onClick={handleGoogle}>
            <GoogleIcon />
            Continue with Google
          </Button>
        ) : null}
      </StaggerGroup>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout headline="Welcome back" subline="Sign in to your workspace.">
      <Suspense>
        <LoginForm />
      </Suspense>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 text-center text-[13px] text-fg-3"
      >
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="link-underline font-medium text-fg transition-colors duration-150 hover:text-violet-bright">
          Create one
        </Link>
      </motion.p>
    </AuthLayout>
  )
}
