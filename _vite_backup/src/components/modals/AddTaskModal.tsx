import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/store/AppState'
import { useToast } from '@/components/ui/Toast'
import type { TaskPriority } from '@/data/mock'

export function AddTaskModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { projects, addTask, navigate } = useAppState()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [due, setDue] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Task title is required.'
    if (!due) next.due = 'Pick a due date.'
    setErrors(next)
    if (Object.keys(next).length) return

    addTask({
      title: title.trim(),
      projectId: projectId || null,
      priority,
      due,
    })
    toast({
      kind: 'success',
      title: 'Task created',
      message: `"${title.trim()}" added to your queue.`,
    })
    setTitle('')
    setProjectId('')
    setPriority('Medium')
    setDue('')
    onClose()
    navigate({ view: 'tasks' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      description="Add a task to your queue."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Task title"
          placeholder="e.g. Review mobile app wireframes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          autoFocus
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </Select>
        </div>
        <Input
          label="Due date"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          error={errors.due}
        />
        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add task</Button>
        </div>
      </form>
    </Modal>
  )
}
