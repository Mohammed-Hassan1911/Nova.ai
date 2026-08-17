'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Magnetic } from '@/components/ui/Magnetic'
import { StaggerGroup } from '@/components/motion/Stagger'
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'
import { validateEmail, validatePassword, validateRequiredText } from '@/lib/validation/validate'
import { EASE_OUT } from '@/components/motion/variants'

function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [loading, setLoading] = useState(false)

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    const nameErr = validateRequiredText(name, 'Name')
    if (nameErr) nextErrors.name = nameErr

    const emailErr = validateEmail(email) ?? (!email ? 'Email is required.' : null)
    if (emailErr) nextErrors.email = emailErr

    const pwErr = validatePassword(password)
    if (pwErr) nextErrors.password = pwErr

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await apiPost('/api/auth/register', {
        name: name.trim(),
        email,
        password,
        confirmPassword,
      })

      // Store password in sessionStorage (not URL params) for security
      sessionStorage.setItem(`verify_pwd_${data.userId}`, password)

      // Navigate to verification page
      const params = new URLSearchParams({
        userId: data.userId,
        method: data.verificationType,
        destination: data.destination,
      })
      router.push(`/verify?${params.toString()}`)
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <StaggerGroup className="space-y-4" stagger={0.06} delayChildren={0.1}>
          <Input
            label="Full name"
            placeholder="Ada Lovelace"
            autoComplete="name"
            floating
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
            floating
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

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            floating
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }))
            }}
            error={errors.confirmPassword}
            icon={<Lock size={15} />}
          />

          <Magnetic className="w-full">
            <Button type="submit" size="lg" full loading={loading} className="group">
              {!loading && (
                <>
                  Create account
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-[220ms] ease-out group-hover:translate-x-[2px]"
                  />
                </>
              )}
            </Button>
          </Magnetic>

          {googleEnabled && (
            <>
              <div className="flex items-center gap-4 py-1">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-fg-3">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <Button type="button" variant="secondary" size="lg" full onClick={() => signIn('google', { callbackUrl: '/onboarding' })}>
                <GoogleIcon />
                Continue with Google
              </Button>
            </>
          )}
        </StaggerGroup>
      </form>
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

export default function SignupPage() {
  return (
    <AuthLayout variant="signup" headline="Create your account" subline="Set up your AI business workspace.">
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
        <Link href="/login" className="link-underline font-medium text-fg transition-colors duration-150 hover:text-violet-bright">
          Sign in
        </Link>
      </motion.p>
    </AuthLayout>
  )
}
