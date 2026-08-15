'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Mail,
  Pencil,
  Phone,
  Trash2,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { fmt, formatDate, initialsOf } from '@/lib/utils'
import { clientStatusLabel, invoiceStatusLabel, projectStatusLabel } from '@/lib/labels'
import type { Client, Invoice, Project, ClientStatus } from '@/lib/types'

type Tab = 'Overview' | 'Projects' | 'Invoices'

export default function ClientProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('Overview')
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    setNotFound(false)
    Promise.all([
      api.get<{ client: Client }>(`/api/clients/${id}`),
      api.get<{ projects: Project[] }>(`/api/projects?clientId=${id}&per_page=50`),
      api.get<{ invoices: Invoice[] }>(`/api/invoices?clientId=${id}&per_page=50`),
    ])
      .then(([c, p, i]) => {
        setClient(c.client)
        setProjects(p.projects)
        setInvoices(i.invoices)
      })
      .catch((err) => {
        if (err instanceof Error && (err as { status?: number }).status === 404) {
          setNotFound(true)
        } else {
          setError(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status !== 'COMPLETED').length
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget ?? 0), 0)
    const invoiced = invoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0)
    const paid = invoices.reduce((s, inv) => s + Number(inv.paid ?? 0), 0)
    const outstanding = invoices.reduce((s, inv) => s + Number(inv.balance ?? 0), 0)
    return { activeProjects, totalBudget, invoiced, paid, outstanding }
  }, [projects, invoices])

  const onSaved = useCallback(
    (updated: Client) => {
      setClient(updated)
      setEditOpen(false)
      toast({ kind: 'success', title: 'Client updated', message: `${updated.company} saved.` })
    },
    [toast],
  )

  const onDeleted = useCallback(() => {
    setEditOpen(false)
    toast({ kind: 'success', title: 'Client deleted', message: 'Client removed from your workspace.' })
    router.push('/clients')
  }, [router, toast])

  if (loading) {
    return (
      <div>
        <Skeleton className="h-4 w-24" />
        <div className="mt-6 flex items-center gap-4">
          <Skeleton className="size-[52px] rounded-[12px]" />
          <div>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-3.5">
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (notFound || error || !client) {
    return (
      <div>
        <Link href="/clients" className="group mb-5 flex w-fit items-center gap-1.5 rounded-[7px] px-2 py-1 text-[13px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg">
          <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
          Clients
        </Link>
        <EmptyState
          icon={notFound ? FolderKanban : CircleDollarSign}
          title={notFound ? 'Client not found' : 'Could not load this client'}
          message={
            notFound
              ? 'This client no longer exists or you do not have access to it.'
              : 'Something went wrong while loading this client. Please try again.'
          }
          actionLabel="Back to clients"
          onAction={() => router.push('/clients')}
        />
      </div>
    )
  }

  return (
    <div>
      <Link href="/clients" className="group mb-5 flex w-fit items-center gap-1.5 rounded-[7px] px-2 py-1 text-[13px] text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg">
        <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
        Clients
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar initials={initialsOf(client.name)} size={52} />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-fg">{client.company}</h1>
              <StatusBadge status={clientStatusLabel[client.status]} />
            </div>
            <p className="mt-0.5 text-[13.5px] text-fg-3">
              {client.name} · Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>
            <Pencil size={13} />
            Edit
          </Button>
          <Button size="md" onClick={() => router.push(`/invoices?create=${client.id}`)}>
            <FileText size={14} />
            New invoice
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-3.5 text-[13px] text-fg-2">
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-2 transition-colors duration-150 hover:text-gold">
            <Mail size={14} className="text-fg-3" />
            {client.email}
          </a>
        )}
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-2 transition-colors duration-150 hover:text-gold">
            <Phone size={14} className="text-fg-3" />
            {client.phone}
          </a>
        )}
        {!client.email && !client.phone && (
          <span className="flex items-center gap-2 text-fg-3">
            <Mail size={14} />
            No contact details on file
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<FolderKanban size={15} />}
          label="Active projects"
          value={String(stats.activeProjects)}
          sub={`${projects.length} total`}
        />
        <SummaryCard
          icon={<Wallet size={15} />}
          label="Total project budget"
          value={fmt(stats.totalBudget)}
          sub="across all projects"
          tone="gold"
        />
        <SummaryCard
          icon={<CircleDollarSign size={15} />}
          label="Invoiced"
          value={fmt(stats.invoiced)}
          sub={`${fmt(stats.outstanding)} outstanding`}
          tone="emerald"
        />
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {(['Overview', 'Projects', 'Invoices'] as Tab[]).map((t) => (
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
              {client.notes ? (
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">{client.notes}</p>
              ) : (
                <p className="mt-3 text-[13px] text-fg-3">No notes yet for this client.</p>
              )}
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-fg">
                <FileText size={14} className="text-fg-3" />
                Billing snapshot
              </div>
              <div className="mt-4 space-y-3">
                <BillingRow label="Invoices issued" value={String(invoices.length)} />
                <BillingRow label="Paid" value={fmt(stats.paid)} />
                <BillingRow label="Outstanding" value={fmt(stats.outstanding)} warn={stats.outstanding > 0} />
              </div>
            </div>
          </div>
        )}

        {tab === 'Projects' && (
          <div className="space-y-3">
            {projects.length === 0 && (
              <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/50 px-5 py-12 text-center">
                <FolderKanban size={18} className="mx-auto text-fg-3" />
                <p className="mt-2 text-[13px] text-fg-3">No projects for this client yet.</p>
              </div>
            )}
            {projects.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-fg">{p.name}</p>
                    <StatusBadge status={projectStatusLabel[p.status]} />
                  </div>
                  <span className="flex items-center gap-1 text-[12.5px] tabular text-fg-3">
                    {fmt(Number(p.spent))} / {fmt(Number(p.budget))}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar
                    value={p.progress}
                    className="flex-1"
                    tone={p.status === 'BEHIND' ? 'danger' : p.status === 'COMPLETED' ? 'emerald' : 'gold'}
                  />
                  <span className="text-[12px] tabular text-fg-3">{p.progress}%</span>
                </div>
                <p className="mt-2 text-[12px] text-fg-3">
                  Deadline {formatDate(p.deadline)}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'Invoices' && (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            {invoices.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-fg-3">No invoices for this client yet.</p>
            ) : (
              invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="group flex w-full items-center justify-between gap-3 border-b border-line px-5 py-3.5 text-left transition-colors duration-150 last:border-b-0 hover:bg-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[13.5px] font-medium text-fg">{inv.number}</span>
                    <span className="text-[12.5px] text-fg-3">{formatDate(inv.issueDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13.5px] font-medium tabular text-fg">{fmt(inv.total)}</span>
                    <StatusBadge status={invoiceStatusLabel[inv.status]} />
                    <ArrowUpRight size={13} className="text-fg-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <ClientEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        client={client}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'emerald' | 'gold'
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[12px] text-fg-3">
        {icon}
        {label}
      </div>
      <p className={cn('mt-1.5 text-[20px] font-semibold tabular tracking-[-0.01em]', tone === 'emerald' ? 'text-emerald' : tone === 'gold' ? 'text-gold' : 'text-fg')}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11.5px] text-fg-3">{sub}</p>}
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

function ClientEditModal({
  open,
  onClose,
  client,
  onSaved,
  onDeleted,
}: {
  open: boolean
  onClose: () => void
  client: Client
  onSaved: (client: Client) => void
  onDeleted: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<ClientStatus>('ACTIVE')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setName(client.name)
      setCompany(client.company)
      setEmail(client.email ?? '')
      setPhone(client.phone ?? '')
      setStatus(client.status)
      setNotes(client.notes ?? '')
      setErrors({})
      setConfirmDelete(false)
    }
  }, [open, client])

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!company.trim()) next.company = 'Company is required.'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const data = await api.patch<{ client: Client }>(`/api/clients/${client.id}`, {
        name: name.trim(),
        company: company.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        status,
        notes: notes.trim() || null,
      })
      onSaved(data.client)
    } catch {
      toast({ kind: 'warning', title: 'Could not save changes', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.del(`/api/clients/${client.id}`)
      onDeleted()
    } catch {
      toast({ kind: 'warning', title: 'Could not delete client', message: 'Please try again.' })
      setDeleting(false)
    }
  }

  return (
    <>
      <Modal
        open={open && !confirmDelete}
        onClose={onClose}
        title="Edit client"
        description={`Update details for ${client.company}.`}
        footer={
          <>
            <Button variant="danger" size="md" className="mr-auto" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button size="md" onClick={() => void submit()} loading={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); void submit() }} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Contact name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} error={errors.company} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
            {(Object.keys(clientStatusLabel) as ClientStatus[]).map((s) => (
              <option key={s} value={s}>{clientStatusLabel[s]}</option>
            ))}
          </Select>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering…"
              className="min-h-[84px] w-full resize-y rounded-[var(--radius-input)] border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete client"
        description={`This will permanently remove ${client.company} and all of its invoices. This cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={() => void doDelete()} loading={deleting}>
              {deleting ? 'Deleting…' : 'Delete client'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-fg-2">
          This action cannot be undone. All invoices belonging to {client.company} will be deleted too.
        </p>
      </Modal>
    </>
  )
}
