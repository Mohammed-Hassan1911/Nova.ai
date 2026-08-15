'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout, GoogleIcon } from '@/components/auth/AuthLayout'
import { useToast } from '@/components/ui/Toast'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!email) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        toast({ kind: 'warning', title: 'Could not sign in', message: 'Check your email and password.' })
      } else {
        router.push(next)
        router.refresh()
      }
    } catch {
      toast({ kind: 'warning', title: 'Could not sign in', message: 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    signIn('google', { callbackUrl: next })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        placeholder="Enter your password"
        autoComplete="current-password"
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
          className="text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-gold"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-[10px] bg-gold text-[14px] font-medium text-[#16130b] transition-all duration-200 hover:bg-gold-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        <span className="relative flex items-center gap-2">
          {loading ? 'Signing in…' : (
            <>
              Sign in
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
        <Button type="button" variant="secondary" size="lg" full onClick={handleGoogle}>
          <GoogleIcon />
          Continue with Google
        </Button>
      ) : null}
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
        <Link href="/signup" className="font-medium text-fg transition-colors duration-150 hover:text-gold">
          Create one
        </Link>
      </motion.p>
    </AuthLayout>
  )
}
