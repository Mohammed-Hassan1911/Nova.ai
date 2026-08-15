import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import type { ProjectStatus } from '@/data/mock'

export function AddProjectModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { clients, addProject, navigate } = useAppState()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('On track')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Project name is required.'
    if (!clientId) next.clientId = 'Select a client.'
    if (!deadline) next.deadline = 'Set a deadline.'
    setErrors(next)
    if (Object.keys(next).length) return

    const budgetNum = Number(budget) || 0
    addProject({
      name: name.trim(),
      clientId,
      deadline,
      budget: budgetNum,
      status,
    })
    toast({
      kind: 'success',
      title: 'Project created',
      message: `"${name.trim()}" is now in your pipeline.`,
    })
    setName('')
    setDeadline('')
    setBudget('')
    setStatus('On track')
    onClose()
    navigate({ view: 'projects' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      description="Scope a project and assign it to a client."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Project name"
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          error={errors.clientId}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company}
            </option>
          ))}
        </Select>
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
            placeholder="10000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        >
          <option value="On track">On track</option>
          <option value="At risk">At risk</option>
          <option value="Behind">Behind</option>
          <option value="Completed">Completed</option>
        </Select>
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create project</Button>
        </div>
      </form>
    </Modal>
  )
}
