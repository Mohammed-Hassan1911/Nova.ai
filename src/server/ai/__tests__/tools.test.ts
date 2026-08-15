import { describe, it, expect } from 'vitest'
import { toolParamSchemas, describeAction, TOOL_KINDS } from '@/server/ai/tools'

describe('toolParamSchemas', () => {
  it('parses valid create_client arguments', () => {
    const parsed = toolParamSchemas.create_client.parse({
      name: 'Maya',
      company: 'Northwind',
      email: 'maya@northwind.co',
    })
    expect(parsed).toMatchObject({ name: 'Maya', company: 'Northwind', status: 'ACTIVE' })
  })

  it('rejects create_client without required fields', () => {
    const res = toolParamSchemas.create_client.safeParse({ email: 'x@y.z' })
    expect(res.success).toBe(false)
  })

  it('normalizes create_task defaults', () => {
    const parsed = toolParamSchemas.create_task.parse({ title: 'Ship feature' })
    expect(parsed.priority).toBe('MEDIUM')
    expect(parsed.status).toBe('TODO')
  })

  it('requires at least one line item on create_invoice', () => {
    const res = toolParamSchemas.create_invoice.safeParse({
      clientId: 'c1',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      items: [],
    })
    expect(res.success).toBe(false)
  })
})

describe('TOOL_KINDS', () => {
  it('classifies every tool as read or write', () => {
    for (const [name, kind] of Object.entries(TOOL_KINDS)) {
      expect(['read', 'write']).toContain(kind)
      expect(toolParamSchemas[name as keyof typeof toolParamSchemas]).toBeDefined()
    }
  })
})

describe('describeAction', () => {
  it('produces human summaries for writes', () => {
    expect(describeAction('create_client', { company: 'Acme' })).toBe('Create client "Acme"')
    expect(describeAction('create_task', { title: 'Fix bug' })).toBe('Create task "Fix bug"')
    expect(
      describeAction('create_invoice', { clientId: 'c1', items: [{}, {}, {}] }),
    ).toBe('Create invoice for client c1 with 3 line item(s)')
  })
})
