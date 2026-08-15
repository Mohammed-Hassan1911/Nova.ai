'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { NovaMark } from '@/components/ui/Logo'
import { useToast } from '@/components/ui/Toast'
import { ApiClientError } from '@/lib/client'

const businessTypes = [
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'AGENCY', label: 'Agency' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'SMALL_BUSINESS', label: 'Small business' },
  { value: 'OTHER', label: 'Something else' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState('FREELANCER')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Give your business a name.')
    setError(undefined)
    setLoading(true)
    try {
      await apiPost('/api/onboarding', {
        name: name.trim(),
        businessType,
      })
      toast({ kind: 'success', title: 'Workspace ready', message: 'Let’s set up your business.' })
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
    <div className="dot-grid relative flex min-h-screen items-center justify-center bg-canvas px-6 py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-gold/[0.04] to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[440px]"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5"
          >
            <NovaMark size={40} />
            <span className="text-[19px] font-semibold tracking-[0.2em] text-fg">NOVA</span>
          </motion.div>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-gold">
            <Sparkles size={10} />
            One more step
          </span>
          <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.02em] text-fg">
            Name your workspace
          </h1>
          <p className="mt-1 text-[13.5px] text-fg-3">
            This is your private command center. You can change it later.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-[var(--radius-panel)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
        >
          <Input
            label="Business name"
            placeholder="e.g. Northwind Studio"
            autoComplete="organization"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(undefined)
            }}
            error={error}
            icon={<Building2 size={15} />}
          />
          <Select
            label="What best describes you?"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            {businessTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <Button type="submit" size="lg" full loading={loading} className="mt-1">
            {!loading && (
              <>
                Create workspace
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </form>
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
