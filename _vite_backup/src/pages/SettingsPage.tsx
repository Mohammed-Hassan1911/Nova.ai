import { useState, type FormEvent } from 'react'
import { Check, CreditCard, Bell, Shield, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'

export function SettingsPage() {
  const { user, signOut } = useAppState()
  const { toast } = useToast()

  const [name, setName] = useState(user.name)
  const [company, setCompany] = useState(user.company)
  const [email, setEmail] = useState(user.email)
  const [billingCycle, setBillingCycle] = useState('Monthly')
  const [notifInvoices, setNotifInvoices] = useState(true)
  const [notifOverdue, setNotifOverdue] = useState(true)
  const [notifDigest, setNotifDigest] = useState(false)

  const saveProfile = (e: FormEvent) => {
    e.preventDefault()
    toast({ kind: 'success', title: 'Profile saved', message: 'Your profile details were updated.' })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">
        Settings
      </h1>
      <p className="mt-1 text-[13.5px] text-fg-3">
        Manage your profile, notifications, and plan.
      </p>

      {/* profile */}
      <Section icon={<User size={15} />} title="Profile">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar initials={user.initials} size={52} />
            <div>
              <p className="text-[14px] font-medium text-fg">{user.name}</p>
              <p className="text-[12.5px] text-fg-3">
                {user.role} at {user.company}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Section>

      {/* notifications */}
      <Section icon={<Bell size={15} />} title="Notifications">
        <div className="space-y-1">
          <ToggleRow
            label="Payment received"
            detail="Notify when a client pays an invoice."
            checked={notifInvoices}
            onChange={setNotifInvoices}
          />
          <ToggleRow
            label="Overdue invoices"
            detail="Alert me when invoices go past due."
            checked={notifOverdue}
            onChange={setNotifOverdue}
          />
          <ToggleRow
            label="Weekly digest"
            detail="A Monday summary of revenue, tasks, and deadlines."
            checked={notifDigest}
            onChange={setNotifDigest}
          />
        </div>
      </Section>

      {/* billing */}
      <Section icon={<CreditCard size={15} />} title="Billing">
        <div className="rounded-[var(--radius-card)] border border-gold/25 bg-gradient-to-br from-gold/10 via-surface to-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-semibold text-fg">
                <Sparkles size={14} className="text-gold" />
                NOVA Pro
              </p>
              <p className="mt-1 text-[12.5px] text-fg-3">
                Unlimited clients, projects, and NOVA AI queries.
              </p>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
              Active
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <Select
              label="Billing cycle"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-40"
            >
              <option>Monthly</option>
              <option>Yearly</option>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast({ kind: 'info', title: 'Manage billing', message: 'Opens the billing portal.' })
              }
            >
              Manage plan
            </Button>
          </div>
        </div>
      </Section>

      {/* security */}
      <Section icon={<Shield size={15} />} title="Security">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-medium text-fg">Sign out</p>
            <p className="text-[12.5px] text-fg-3">You can sign back in at any time.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Section>

      <p className="pb-4 text-center text-[12px] text-fg-3">
        NOVA v1.0 · Made for solo operators and small studios.
      </p>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-7 rounded-[var(--radius-panel)] border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <span className="text-fg-3">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-fg">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

function ToggleRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string
  detail: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-[13.5px] font-medium text-fg">{label}</p>
        <p className="text-[12.5px] text-fg-3">{detail}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-gold/40 bg-gold/25' : 'border-line-strong bg-surface-2',
        )}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={cn(
            'absolute top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200',
            checked ? 'left-[22px] bg-gold' : 'left-[3px] bg-fg-3',
          )}
        >
          {checked && <Check size={10} strokeWidth={3} className="text-canvas" />}
        </span>
      </button>
    </div>
  )
}
