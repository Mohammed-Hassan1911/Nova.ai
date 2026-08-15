import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Wallet,
  FolderKanban,
  FileText,
  CircleDollarSign,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { ActivityTimeline } from '@/pages/Dashboard'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import { fmt, formatDate } from '@/lib/utils'
import { type ClientStatus } from '@/data/mock'

type Tab = 'Overview' | 'Projects' | 'Invoices' | 'Activity'

export function ClientProfile({ clientId }: { clientId: string }) {
  const { clients, projects, invoices, navigate, updateClientStatus } = useAppState()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('Overview')

  const client = clients.find((c) => c.id === clientId)

  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === clientId),
    [projects, clientId],
  )
  const clientInvoices = useMemo(
    () => invoices.filter((i) => i.clientId === clientId),
    [invoices, clientId],
  )
  const outstanding = clientInvoices
    .filter((i) => i.status !== 'Paid')
    .reduce((s, i) => s + i.amount, 0)

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[14px] text-fg-2">This client could not be found.</p>
        <button
          onClick={() => navigate({ view: 'clients' })}
          className="mt-3 text-[13px] text-gold hover:text-gold-bright"
        >
          ← Back to clients
        </button>
      </div>
    )
  }

  const handleStatus = (status: ClientStatus) => {
    updateClientStatus(client.id, status)
    toast({ kind: 'success', title: 'Client updated', message: `${client.company} is now ${status.toLowerCase()}.` })
  }

  return (
    <div>
      <button
        onClick={() => navigate({ view: 'clients' })}
        className="group mb-5 flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[13px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
      >
        <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
        Clients
      </button>

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar initials={client.initials} size={52} />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-fg">
                {client.company}
              </h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="mt-0.5 text-[13.5px] text-fg-3">
              {client.name} · Client since {client.since}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={client.status}
            onChange={(e) => handleStatus(e.target.value as ClientStatus)}
            className="h-9 cursor-pointer rounded-[8px] border border-line bg-surface px-3 text-[13px] text-fg-2 transition-colors duration-150 hover:border-line-strong focus:border-gold/50 [&>option]:bg-surface"
          >
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </select>
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              toast({ kind: 'info', title: 'Contact exported', message: `${client.company} vCard downloaded.` })
            }
          >
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* contact strip */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-3.5 text-[13px] text-fg-2">
        <span className="flex items-center gap-2">
          <Mail size={14} className="text-fg-3" />
          {client.email}
        </span>
        <span className="flex items-center gap-2">
          <Phone size={14} className="text-fg-3" />
          {client.phone}
        </span>
        <span className="flex items-center gap-2">
          <MapPin size={14} className="text-fg-3" />
          Remote · Worldwide
        </span>
      </div>

      {/* financial summary */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<CircleDollarSign size={15} />}
          label="Total revenue"
          value={fmt(client.revenue)}
        />
        <SummaryCard
          icon={<Wallet size={15} />}
          label="Outstanding"
          value={fmt(outstanding)}
          tone={outstanding > 0 ? 'warn' : 'ok'}
        />
        <SummaryCard
          icon={<FolderKanban size={15} />}
          label="Active projects"
          value={String(clientProjects.filter((p) => p.status !== 'Completed').length)}
        />
      </div>

      {/* tabs */}
      <div className="mt-6 flex gap-1 border-b border-line">
        {(['Overview', 'Projects', 'Invoices', 'Activity'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative -mb-px px-3.5 pb-2.5 pt-1 text-[13.5px] font-medium transition-colors duration-150',
              tab === t ? 'text-fg' : 'text-fg-3 hover:text-fg-2',
            )}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="client-tab"
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-gold"
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-fg">
                <Building2 size={14} className="text-fg-3" />
                About this client
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                {client.notes}
              </p>
              <div className="mt-4 border-t border-line pt-3 text-[12.5px] text-fg-3">
                Last activity: {client.lastActivity}
              </div>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-fg">
                <FileText size={14} className="text-fg-3" />
                Billing snapshot
              </div>
              <div className="mt-4 space-y-3">
                <BillingRow label="Invoices issued" value={String(clientInvoices.length)} />
                <BillingRow label="Paid" value={fmt(clientInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0))} />
                <BillingRow label="Outstanding" value={fmt(outstanding)} warn={outstanding > 0} />
              </div>
            </div>
          </div>
        )}

        {tab === 'Projects' && (
          <div className="space-y-3">
            {clientProjects.length === 0 && (
              <p className="rounded-[var(--radius-card)] border border-dashed border-line px-5 py-10 text-center text-[13px] text-fg-3">
                No projects for this client yet.
              </p>
            )}
            {clientProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate({ view: 'projects' })}
                className="group cursor-pointer rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-fg">{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <span className="flex items-center gap-1 text-[12.5px] tabular text-fg-3">
                    {fmt(p.spent)} / {fmt(p.budget)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar
                    value={p.progress}
                    className="flex-1"
                    tone={p.status === 'Behind' ? 'danger' : p.status === 'Completed' ? 'emerald' : 'gold'}
                  />
                  <span className="text-[12px] tabular text-fg-3">{p.progress}%</span>
                </div>
                <p className="mt-2 text-[12px] text-fg-3">
                  Deadline {formatDate(p.deadline)}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'Invoices' && (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            {clientInvoices.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-fg-3">
                No invoices for this client yet.
              </p>
            ) : (
              clientInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => navigate({ view: 'invoice', id: inv.id })}
                  className="group flex w-full items-center justify-between gap-3 border-b border-line px-5 py-3.5 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[13.5px] font-medium text-fg">{inv.id}</span>
                    <span className="text-[12.5px] text-fg-3">{formatDate(inv.issueDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13.5px] font-medium tabular text-fg">{fmt(inv.amount)}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'Activity' && (
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <ActivityTimeline limit={6} />
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'ok' | 'warn'
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[12px] text-fg-3">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          'mt-1.5 text-[20px] font-semibold tabular tracking-[-0.01em]',
          tone === 'ok' ? 'text-emerald' : tone === 'warn' ? 'text-gold' : 'text-fg',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function BillingRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-fg-3">{label}</span>
      <span className={cn('font-medium tabular', warn ? 'text-gold' : 'text-fg')}>{value}</span>
    </div>
  )
}
