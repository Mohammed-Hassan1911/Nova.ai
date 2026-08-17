'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { EASE_OUT } from '@/components/motion/variants'

type UiState = 'input' | 'verifying' | 'signing-in' | 'success'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mountedRef = useRef(true)

  const verificationCodeId = searchParams.get('userId') ?? ''
  const destination = searchParams.get('destination') ?? ''

  const [code, setCode] = useState('')
  const [uiState, setUiState] = useState<UiState>('input')
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  // Ref guard: prevents double-submission without relying on React state
  // (which can be stale inside useCallback closures).
  const verifyingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && uiState === 'input' && !verifyingRef.current) {
      void handleVerify(code)
    }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const waitForSession = async (maxAttempts = 10, delayMs = 300): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch('/api/auth/session', { signal: controller.signal })
        clearTimeout(timeout)
        const session = await res.json()
        if (session?.user?.id) return true
      } catch {
        // network hiccup or timeout — retry
      }
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
    return false
  }

  const handleVerify = useCallback(
    async (verifyCode: string) => {
      if (!verificationCodeId) return
      if (verifyingRef.current) return
      verifyingRef.current = true

      setError('')
      setUiState('verifying')

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30_000)

        let res: Response
        try {
          res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: verificationCodeId, type: 'EMAIL', code: verifyCode }),
            signal: controller.signal,
          })
        } catch (fetchErr) {
          clearTimeout(timeout)
          if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
            throw new Error('Verification is taking too long. Please try again.')
          }
          throw new Error('We couldn\'t verify your code right now. Please try again.')
        }
        clearTimeout(timeout)

        let data: Record<string, unknown>
        try {
          data = await res.json()
        } catch {
          throw new Error('The server returned an unexpected response. Please try again.')
        }

        if (!res.ok) {
          const errObj = data.error as { code?: string; message?: string } | undefined
          const code = errObj?.code ?? 'VERIFY_FAILED'
          const message = errObj?.message ?? 'Verification failed. Please try again.'
          throw new VerifyError(code, message)
        }

        const verifyData = data.data as { actualDestination?: string } | undefined
        const actualDestination = verifyData?.actualDestination

        const storedPassword = sessionStorage.getItem(`verify_pwd_${verificationCodeId}`)

        if (!storedPassword || !actualDestination) {
          router.push('/login?message=Account+created.+Please+sign+in+with+your+credentials.')
          return
        }

        setUiState('signing-in')

        const signInPromise = signIn('credentials', {
          identifier: actualDestination,
          password: storedPassword,
          redirect: false,
        })
        const signInTimeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('signIn timed out')), 20_000),
        )
        const signInResult = await Promise.race([signInPromise, signInTimeout])

        if (!signInResult || signInResult?.error) {
          sessionStorage.removeItem(`verify_pwd_${verificationCodeId}`)
          router.push('/login?message=Account+created.+Please+sign+in+with+your+credentials.')
          return
        }

        sessionStorage.removeItem(`verify_pwd_${verificationCodeId}`)

        if (mountedRef.current) {
          const sessionReady = await waitForSession()
          if (!sessionReady) {
            router.push('/login?message=Account+created.+Please+sign+in+with+your+credentials.')
            return
          }
        }

        if (mountedRef.current) {
          setUiState('success')
          setTimeout(() => {
            if (mountedRef.current) router.push('/onboarding')
          }, 1800)
        }
      } catch (err) {
        if (!mountedRef.current) return

        setUiState('input')

        if (err instanceof VerifyError) {
          switch (err.code) {
            case 'TOO_MANY_ATTEMPTS':
            case 'RATE_LIMITED':
              setError('Too many verification attempts. Please request a new code.')
              break
            case 'CODE_EXPIRED':
              setError('This verification code has expired. Please request a new code.')
              break
            case 'INVALID_CODE':
              setError('Invalid verification code. Please check the code and try again.')
              break
            default:
              setError(err.message || 'Verification failed. Please try again.')
          }
        } else if (err instanceof Error) {
          setError(err.message || 'Something went wrong. Please try again.')
        } else {
          setError('Something went wrong. Please try again.')
        }
      } finally {
        verifyingRef.current = false
      }
    },
    [verificationCodeId, router],
  )

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: verificationCodeId, type: 'EMAIL' }),
      })
      const data = await res.json()

      if (!data.success) {
        const msg = data.error?.message ?? 'Could not resend.'
        throw new Error(msg)
      }

      setResendCooldown(60)
      setCode('')
      setUiState('input')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the verification code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (!verificationCodeId) {
    return (
      <AuthLayout headline="Verify your account" subline="Something went wrong.">
        <div className="text-center">
          <p className="text-[13px] text-fg-3">Missing verification details. Please sign up again.</p>
          <Link href="/signup" className="mt-4 inline-block text-[13px] font-medium text-violet-bright hover:text-violet">
            Back to sign up
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (uiState === 'success') {
    return (
      <AuthLayout headline="You're all set" subline="Your account has been verified.">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-col items-center py-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald/10"
          >
            <CheckCircle2 size={32} className="text-emerald" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-[14px] text-fg-2"
          >
            Redirecting you to onboarding...
          </motion.p>
        </motion.div>
      </AuthLayout>
    )
  }

  if (uiState === 'signing-in') {
    return (
      <AuthLayout headline="Signing you in" subline="Setting up your session...">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-col items-center py-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="mb-4 flex size-16 items-center justify-center rounded-full bg-violet/10"
          >
            <div className="size-8 rounded-full border-2 border-violet border-t-transparent" />
          </motion.div>
          <p className="text-[14px] text-fg-2">Creating your account and signing you in...</p>
        </motion.div>
      </AuthLayout>
    )
  }

  const maskedDestination = destination.replace(/(.{1})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 8)) + c)

  return (
    <AuthLayout
      headline="Verify your email"
      subline={`We sent a 6-digit code to ${maskedDestination}`}
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          if (code.length === 6 && uiState === 'input') void handleVerify(code)
        }}
        noValidate
      >
        <div className="flex flex-col items-center gap-6">
          <div className="text-fg-3">
            <Mail size={24} />
          </div>

          <VerificationCodeInput
            value={code}
            onChange={setCode}
            error={error}
            disabled={uiState === 'verifying'}
          />

          <Button
            type="submit"
            size="lg"
            full
            loading={uiState === 'verifying'}
            disabled={code.length !== 6 || uiState === 'verifying'}
          >
            {uiState === 'verifying' ? 'Verifying...' : 'Verify'}
          </Button>

          <div className="flex flex-col items-center gap-3 text-[13px]">
            {resendCooldown > 0 ? (
              <span className="text-fg-3">Resend code in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-fg-3 transition-colors duration-150 hover:text-violet-bright disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            )}
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-fg-3 transition-colors duration-150 hover:text-fg"
            >
              <ArrowLeft size={13} />
              Change email
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}

/**
 * Simple error class for verification-specific errors.
 * Replaces ApiClientError so there are zero external dependencies
 * in the error path and nothing can be swallowed by a wrapper.
 */
class VerifyError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'VerifyError'
    this.code = code
  }
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
