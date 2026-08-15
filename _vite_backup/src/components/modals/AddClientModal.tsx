import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import type { ClientStatus } from '@/data/mock'

export function AddClientModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { addClient, navigate } = useAppState()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<ClientStatus>('Active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setName('')
    setCompany('')
    setEmail('')
    setPhone('')
    setStatus('Active')
    setErrors({})
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Contact name is required.'
    if (!company.trim()) next.company = 'Company is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) return

    addClient({ name: name.trim(), company: company.trim(), email: email.trim(), phone: phone.trim(), status, notes: '' })
    toast({
      kind: 'success',
      title: 'Client added',
      message: `${company.trim()} is now in your workspace.`,
    })
    reset()
    onClose()
    navigate({ view: 'clients' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add client"
      description="Add a client and their details to your workspace."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Contact name"
            placeholder="e.g. Maya Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoFocus
          />
          <Input
            label="Company"
            placeholder="e.g. Acme Studio"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            error={errors.company}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="contact@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
          >
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add client</Button>
        </div>
      </form>
    </Modal>
  )
}
