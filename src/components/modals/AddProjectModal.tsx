'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { projectStatusLabel } from '@/lib/labels'
import { cn, clientLabel } from '@/lib/utils'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { Client, Project, ProjectStatus } from '@/lib/types'

const statuses: ProjectStatus[] = ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']

export function AddProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (project: Project) => void
}) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('ON_TRACK')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [clientQuery, setClientQuery] = useState('')
  const [clientMenuOpen, setClientMenuOpen] = useState(false)
  const clientWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setClientId('')
    setStatus('ON_TRACK')
    setDeadline('')
    setBudget('')
    setDescription('')
    setClientQuery('')
    setClientMenuOpen(false)
    setErrors({})
    if (clients.length === 0) {
      api
        .get<{ clients: Client[] }>('/api/clients?per_page=50')
        .then((data) => setClients(data.clients))
        .catch(() => setClients([]))
    }
  }, [open, clients.length])

  useEffect(() => {
    if (!clientMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (clientWrapRef.current && !clientWrapRef.current.contains(e.target as Node)) {
        setClientMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [clientMenuOpen])

  const query = clientQuery.trim().toLowerCase()
  const filteredClients = query
    ? clients.filter((c) =>
        [c.name, c.company, c.email ?? ''].some((s) => s.toLowerCase().includes(query)),
      )
    : clients
  const selectedClient = clients.find((c) => c.id === clientId)

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Project name is required.'
    if (!clientId) next.clientId = 'Select a client.'
    if (deadline && Number.isNaN(Date.parse(deadline))) next.deadline = 'Invalid date.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const data = await api.post<{ project: Project }>('/api/projects', {
        name: name.trim(),
        clientId,
        status,
        budget: Number(budget) || 0,
        deadline: deadline || null,
        description: description.trim() || null,
      })
      onCreated?.(data.project)
      toast({ kind: 'success', title: 'Project created', message: `"${name.trim()}" added to your pipeline.` })
    } catch {
      toast({ kind: 'warning', title: 'Could not create project', message: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      description="Scope a project and assign it to a client."
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => void submit()} loading={loading}>
            {loading ? 'Creating…' : 'Create project'}
          </Button>
        </>
      }
    >
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />
        <div ref={clientWrapRef} className="relative">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Client</span>
          <button
            type="button"
            onClick={() => setClientMenuOpen((v) => !v)}
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-input)] border border-line bg-surface px-3.5 text-[14px] transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]',
              !selectedClient && 'text-fg-3/70',
            )}
          >
            <span className="truncate">
              {selectedClient ? clientLabel(selectedClient) : 'Select a client…'}
            </span>
            <ChevronDown
              size={15}
              className={cn(
                'shrink-0 text-fg-3 transition-transform duration-150',
                clientMenuOpen && 'rotate-180',
              )}
            />
          </button>
          {clientMenuOpen && (
            <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-[var(--radius-input)] border border-line-strong bg-surface shadow-[var(--shadow-pop)]">
              <div className="relative border-b border-line">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3"
                />
                <input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setClientMenuOpen(false)
                    }
                  }}
                  placeholder="Search name, company, email…"
                  className="h-10 w-full bg-transparent pl-9 pr-3 text-[14px] text-fg placeholder:text-fg-3/70 focus:outline-none"
                  autoFocus
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {filteredClients.length === 0 ? (
                  <li className="px-3.5 py-2.5 text-[13px] text-fg-3">
                    No clients match "{clientQuery}".
                  </li>
                ) : (
                  filteredClients.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setClientId(c.id)
                          setClientMenuOpen(false)
                          setClientQuery('')
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[14px] text-fg transition-colors duration-100 hover:bg-hover"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{clientLabel(c)}</span>
                          {c.email && (
                            <span className="block truncate text-[12px] text-fg-3">{c.email}</span>
                          )}
                        </span>
                        {c.id === clientId && <Check size={14} className="shrink-0 text-gold" />}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
          {errors.clientId && (
            <span className="mt-1.5 block text-[12.5px] text-danger">{errors.clientId}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            error={errors.deadline}
          />
          <Input
            label="Budget (USD)"
            type="number"
            min={0}
            placeholder="10000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {projectStatusLabel[s]}
            </option>
          ))}
        </Select>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope, milestones, anything worth noting…"
            className="min-h-[80px] w-full resize-y rounded-[var(--radius-input)] border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
          />
        </label>
      </form>
    </Modal>
  )
}
