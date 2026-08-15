'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { taskPriorityLabel } from '@/lib/labels'
import type { Project, Task, TaskPriority } from '@/lib/types'

const priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH']

export function AddTaskModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (task: Task) => void
}) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setProjectId('')
    setPriority('MEDIUM')
    setDueDate('')
    setErrors({})
    if (projects.length === 0) {
      api
        .get<{ projects: Project[] }>('/api/projects?per_page=50')
        .then((data) => setProjects(data.projects))
        .catch(() => setProjects([]))
    }
  }, [open, projects.length])

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Task title is required.'
    if (!dueDate) next.dueDate = 'Pick a due date.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const data = await api.post<{ task: Task }>('/api/tasks', {
        title: title.trim(),
        description: description.trim() || null,
        projectId: projectId || null,
        priority,
        status: 'TODO',
        dueDate: dueDate || null,
      })
      onCreated?.(data.task)
      toast({ kind: 'success', title: 'Task created', message: `"${title.trim()}" added to your queue.` })
    } catch {
      toast({ kind: 'warning', title: 'Could not create task', message: 'Please try again.' })
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
      title="New task"
      description="Add a task to your queue."
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={() => void submit()} loading={loading}>
            {loading ? 'Adding…' : 'Add task'}
          </Button>
        </>
      }
    >
      <form onSubmit={onFormSubmit} noValidate className="space-y-4">
        <Input
          label="Task title"
          placeholder="e.g. Review mobile app wireframes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          autoFocus
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {taskPriorityLabel[p]}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.dueDate}
        />
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-fg-2">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            className="min-h-[72px] w-full resize-y rounded-[var(--radius-input)] border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-3/70 transition-all duration-150 hover:border-line-strong focus:border-gold/50 focus:shadow-[var(--shadow-focus)]"
          />
        </label>
      </form>
    </Modal>
  )
}
