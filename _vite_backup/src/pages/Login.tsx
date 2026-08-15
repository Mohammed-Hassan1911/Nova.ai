import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NovaMark } from '@/components/ui/Logo'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Login() {
  const { signIn } = useAppState()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const validate = () => {
    const next: typeof errors = {}
    if (!email) next.email = 'Email is required.'
    else if (!emailPattern.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      signIn()
      toast({ kind: 'success', title: 'Welcome back', message: 'Your command center is ready.' })
    }, 1100)
  }

  const handleGoogle = () => {
    setGoogleLoading(true)
    window.setTimeout(() => {
      setGoogleLoading(false)
      signIn()
      toast({ kind: 'success', title: 'Signed in with Google', message: 'Your command center is ready.' })
    }, 1000)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Left — brand visual */}
      <div className="relative hidden overflow-hidden border-r border-line bg-canvas-deep lg:block">
        <GeometricBackdrop />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-14">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <NovaMark size={34} />
            <span className="text-[17px] font-semibold tracking-[0.2em] text-fg">
              NOVA
            </span>
          </motion.div>

          <div className="max-w-lg pb-[10vh]">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold"
            >
              <Sparkles size={11} />
              AI Business Command Center
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-balance text-[40px] font-semibold leading-[1.08] tracking-[-0.025em] text-fg xl:text-[48px]"
            >
              Run your business.
              <br />
              <span className="text-fg-3">Not your spreadsheets.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-5 max-w-sm text-[15px] leading-relaxed text-fg-2"
            >
              One intelligent workspace for clients, projects, payments, and
              everything in between.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex items-center gap-6 text-[11.5px] text-fg-3"
          >
            <span>Trusted by independent businesses</span>
            <span className="h-3 w-px bg-line-strong" />
            <span>$143K collected this year</span>
          </motion.div>
        </div>
      </div>

      {/* Right — auth */}
      <div className="relative flex items-center justify-center bg-canvas px-6 py-14 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-9 lg:mb-11">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5"
            >
              <NovaMark size={40} />
              <span className="text-[19px] font-semibold tracking-[0.2em] text-fg">
                NOVA
              </span>
            </motion.div>
            <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.02em] text-fg">
              Welcome back
            </h2>
            <p className="mt-1 text-[13.5px] text-fg-3">Sign in to your workspace.</p>
          </div>

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
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }))
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
              <button
                type="button"
                className="text-[12.5px] text-fg-3 transition-colors duration-150 hover:text-gold"
              >
                Forgot password?
              </button>
            </div>

            <SignInButton loading={loading} />

            <div className="flex items-center gap-4 py-0.5">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-fg-3">
                or
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              full
              loading={googleLoading}
              onClick={handleGoogle}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8 text-center text-[13px] text-fg-3"
          >
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-medium text-fg transition-colors duration-150 hover:text-gold"
            >
              Create one
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

function SignInButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-[10px] bg-gold text-[14px] font-medium text-[#16130b] transition-all duration-200 hover:bg-gold-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Signing in…
          </span>
        ) : (
          <>
            Sign in
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </>
        )}
      </span>
    </button>
  )
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

/* Subtle geometric lines + points background */
function GeometricBackdrop() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 600px at 20% 0%, rgba(201,168,108,0.05), transparent 60%), radial-gradient(800px 600px at 90% 90%, rgba(52,211,153,0.04), transparent 55%)',
        }}
      />

      {/* thin geometric lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 640 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
          <path d="M0 320 L640 180" />
          <path d="M0 560 L640 420" />
          <path d="M0 720 L640 640" />
          <path d="M180 0 L320 900" />
          <path d="M470 0 L420 900" />
        </g>
        <g stroke="rgba(201,168,108,0.16)" strokeWidth="1">
          <path d="M0 420 L640 300" />
        </g>
        {/* points */}
        <g fill="rgba(255,255,255,0.5)">
          <circle cx="320" cy="180" r="2.5" />
          <circle cx="420" cy="420" r="2" />
          <circle cx="180" cy="560" r="2.5" />
        </g>
        <g fill="#C9A86C">
          <circle cx="470" cy="300" r="2" />
        </g>
        <g fill="#34D399">
          <circle cx="210" cy="300" r="2" />
        </g>
      </svg>

      <div
        className="dot-grid absolute inset-0 opacity-40"
        style={{
          maskImage: 'radial-gradient(700px 500px at 35% 25%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(700px 500px at 35% 25%, black, transparent 70%)',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-canvas-deep via-transparent to-canvas-deep/50" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-canvas-deep/90 to-transparent" />
    </div>
  )
}
