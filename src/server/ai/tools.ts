import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/errors'
import { computeInvoiceTotals, itemsToLines, nextInvoiceNumber, markInvoicePaid } from '@/server/services/invoices'
import { recordActivity } from '@/server/services/activity'
import type { JSONSchema } from './types'

const ws = (id: string) => ({ workspaceId: id })

// ------------------------- parameter schemas (zod, validated) -------------------------

export const toolParamSchemas = {
  list_clients: z.object({ status: z.enum(['ACTIVE', 'PROSPECT', 'INACTIVE']).optional() }),
  get_client: z.object({ id: z.string().min(1) }),
  list_projects: z.object({ status: z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']).optional() }),
  list_tasks: z.object({ status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional() }),
  get_invoice: z.object({ id: z.string().min(1) }),
  get_metrics: z.object({}),
  get_activity: z.object({ limit: z.number().int().min(1).max(20).default(8) }),

  create_client: z.object({
    name: z.string().min(1).max(120),
    company: z.string().min(1).max(120),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'PROSPECT', 'INACTIVE']).default('ACTIVE'),
    notes: z.string().optional().nullable(),
  }),
  update_client: z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(120).optional(),
    company: z.string().min(1).max(120).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'PROSPECT', 'INACTIVE']).optional(),
  }),
  create_project: z.object({
    name: z.string().min(1).max(160),
    clientId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']).default('ON_TRACK'),
    progress: z.number().int().min(0).max(100).default(0),
    budget: z.number().min(0).default(0),
    deadline: z.string().optional().nullable(),
  }),
  update_project: z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(160).optional(),
    status: z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']).optional(),
    progress: z.number().int().min(0).max(100).optional(),
    budget: z.number().min(0).optional(),
    deadline: z.string().optional().nullable(),
  }),
  create_task: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).default('TODO'),
    dueDate: z.string().optional().nullable(),
  }),
  update_task: z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
    dueDate: z.string().optional().nullable(),
  }),
  create_invoice: z.object({
    clientId: z.string().min(1),
    issueDate: z.string(),
    dueDate: z.string(),
    taxRate: z.number().min(0).max(100).default(0),
    discount: z.number().min(0).default(0),
    note: z.string().optional().nullable(),
    items: z.array(
      z.object({
        description: z.string().min(1).max(300),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
      }),
    ).min(1),
  }),
  update_invoice_status: z.object({
    id: z.string().min(1),
    status: z.enum(['DRAFT', 'PENDING', 'PAID', 'CANCELLED']),
  }),
} as const

export type ToolName = keyof typeof toolParamSchemas
export type ToolKind = 'read' | 'write'

export const TOOL_KINDS: Record<ToolName, ToolKind> = {
  list_clients: 'read',
  get_client: 'read',
  list_projects: 'read',
  list_tasks: 'read',
  get_invoice: 'read',
  get_metrics: 'read',
  get_activity: 'read',
  create_client: 'write',
  update_client: 'write',
  create_project: 'write',
  update_project: 'write',
  create_task: 'write',
  update_task: 'write',
  create_invoice: 'write',
  update_invoice_status: 'write',
}

type S = z.ZodTypeAny
const str = (description: string, enumVals?: readonly string[]): JSONSchema =>
  enumVals ? { type: 'string', description, enum: [...enumVals] } : { type: 'string', description }
const num = (description: string): JSONSchema => ({ type: 'number', description })
const bool = (description: string): JSONSchema => ({ type: 'boolean', description })
const obj = (properties: Record<string, JSONSchema>, required: string[] = []): JSONSchema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})
const arr = (items: JSONSchema, description: string): JSONSchema => ({ type: 'array', items, description })

/** JSON Schema descriptors sent to the model. Keep them strict so the model returns clean args. */
export const TOOL_DEFINITIONS: { type: 'function'; function: { name: ToolName; description: string; parameters: JSONSchema } }[] = [
  {
    type: 'function',
    function: {
      name: 'list_clients',
      description: 'List clients in the workspace. Optionally filter by status.',
      parameters: obj({ status: str('Filter by client status', ['ACTIVE', 'PROSPECT', 'INACTIVE']) }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_client',
      description: 'Get full details of a single client, including projects, invoices and payments.',
      parameters: obj({ id: str('The client id') }, ['id']),
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'List projects in the workspace. Optionally filter by status.',
      parameters: obj({ status: str('Filter by project status', ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']) }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List tasks in the workspace. Optionally filter by status.',
      parameters: obj({ status: str('Filter by task status', ['TODO', 'IN_PROGRESS', 'COMPLETED']) }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoice',
      description: 'Get details of an invoice including line items and payments.',
      parameters: obj({ id: str('The invoice id') }, ['id']),
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_metrics',
      description: 'Get revenue, outstanding amounts, client/project/task counts and recent activity for the workspace.',
      parameters: obj({}),
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_activity',
      description: 'Get the most recent activity events in the workspace.',
      parameters: obj({ limit: num('How many events to return (max 20)') }),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Create a new client in the workspace.',
      parameters: obj(
        {
          name: str('Contact name'),
          company: str('Company name'),
          email: str('Contact email'),
          phone: str('Contact phone'),
          status: str('Client status', ['ACTIVE', 'PROSPECT', 'INACTIVE']),
          notes: str('Free-form notes'),
        },
        ['name', 'company'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_client',
      description: 'Update fields on an existing client.',
      parameters: obj(
        {
          id: str('The client id'),
          name: str('Contact name'),
          company: str('Company name'),
          email: str('Contact email'),
          phone: str('Contact phone'),
          status: str('Client status', ['ACTIVE', 'PROSPECT', 'INACTIVE']),
        },
        ['id'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Create a new project, optionally tied to a client.',
      parameters: obj(
        {
          name: str('Project name'),
          clientId: str('Client id (find one first with list_clients if unsure)'),
          description: str('Project description'),
          status: str('Project status', ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']),
          progress: num('Progress percentage 0-100'),
          budget: num('Budget amount'),
          deadline: str('Deadline date (YYYY-MM-DD)'),
        },
        ['name'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description: 'Update fields on an existing project.',
      parameters: obj(
        {
          id: str('The project id'),
          name: str('Project name'),
          status: str('Project status', ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']),
          progress: num('Progress percentage 0-100'),
          budget: num('Budget amount'),
          deadline: str('Deadline date (YYYY-MM-DD)'),
        },
        ['id'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task, optionally tied to a project.',
      parameters: obj(
        {
          title: str('Task title'),
          description: str('Task description'),
          projectId: str('Project id (find one first with list_projects if unsure)'),
          priority: str('Priority', ['LOW', 'MEDIUM', 'HIGH']),
          status: str('Status', ['TODO', 'IN_PROGRESS', 'COMPLETED']),
          dueDate: str('Due date (YYYY-MM-DD)'),
        },
        ['title'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update fields on an existing task.',
      parameters: obj(
        {
          id: str('The task id'),
          title: str('Task title'),
          description: str('Task description'),
          priority: str('Priority', ['LOW', 'MEDIUM', 'HIGH']),
          status: str('Status', ['TODO', 'IN_PROGRESS', 'COMPLETED']),
          dueDate: str('Due date (YYYY-MM-DD)'),
        },
        ['id'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create a draft invoice for a client with line items.',
      parameters: obj(
        {
          clientId: str('Client id (find one first with list_clients if unsure)'),
          issueDate: str('Issue date (YYYY-MM-DD)'),
          dueDate: str('Due date (YYYY-MM-DD)'),
          taxRate: num('Tax percentage'),
          discount: num('Discount amount'),
          note: str('Note on the invoice'),
          items: arr(
            obj(
              {
                description: str('Line item description'),
                quantity: num('Quantity'),
                unitPrice: num('Unit price'),
              },
              ['description', 'quantity', 'unitPrice'],
            ),
            'Line items on the invoice',
          ),
        },
        ['clientId', 'issueDate', 'dueDate', 'items'],
      ),
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_invoice_status',
      description: 'Change the status of an invoice (send, cancel, or mark paid).',
      parameters: obj(
        {
          id: str('The invoice id'),
          status: str('New status', ['DRAFT', 'PENDING', 'PAID', 'CANCELLED']),
        },
        ['id', 'status'],
      ),
    },
  },
]

// ------------------------------- executors -------------------------------

export interface ToolContext {
  workspaceId: string
}

export interface ToolResult {
  ok: boolean
  text: string
}

function serializeDate(d: Date | null): string | null {
  return d ? d.toISOString() : null
}

export const toolExecutors: Record<ToolName, (ctx: ToolContext, args: z.infer<S>) => Promise<ToolResult>> = {
  async list_clients({ workspaceId }, args) {
    const rows = await prisma.client.findMany({
      where: { ...ws(workspaceId), ...(args.status ? { status: args.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, name: true, company: true, email: true, status: true, createdAt: true },
    })
    return { ok: true, text: JSON.stringify({ count: rows.length, clients: rows }) }
  },

  async get_client({ workspaceId }, args) {
    const client = await prisma.client.findFirst({
      where: { id: args.id, workspaceId },
      include: {
        projects: { select: { id: true, name: true, status: true, progress: true } },
        invoices: { select: { id: true, number: true, status: true, dueDate: true } },
      },
    })
    if (!client) return { ok: false, text: 'Client not found.' }
    return { ok: true, text: JSON.stringify(client) }
  },

  async list_projects({ workspaceId }, args) {
    const rows = await prisma.project.findMany({
      where: { ...ws(workspaceId), ...(args.status ? { status: args.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { client: { select: { company: true } }, _count: { select: { tasks: true } } },
    })
    return {
      ok: true,
      text: JSON.stringify({ count: rows.length, projects: rows.map((p) => ({ ...p, deadline: serializeDate(p.deadline) })) }),
    }
  },

  async list_tasks({ workspaceId }, args) {
    const rows = await prisma.task.findMany({
      where: { ...ws(workspaceId), ...(args.status ? { status: args.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { project: { select: { name: true } } },
    })
    return {
      ok: true,
      text: JSON.stringify({ count: rows.length, tasks: rows.map((t) => ({ ...t, dueDate: serializeDate(t.dueDate), completedAt: serializeDate(t.completedAt) })) }),
    }
  },

  async get_invoice({ workspaceId }, args) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: args.id, workspaceId },
      include: { items: true, payments: true, client: { select: { company: true, name: true } } },
    })
    if (!invoice) return { ok: false, text: 'Invoice not found.' }
    const totals = computeInvoiceTotals(itemsToLines(invoice.items), Number(invoice.taxRate), Number(invoice.discount))
    return {
      ok: true,
      text: JSON.stringify({
        ...invoice,
        items: invoice.items,
        payments: invoice.payments.map((p) => ({ amount: Number(p.amount), method: p.method, paidAt: p.paidAt })),
        ...totals,
        paid: invoice.payments.reduce((s, p) => s + Number(p.amount), 0),
      }),
    }
  },

  async get_metrics({ workspaceId }) {
    const [clients, projects, openTasks, paidInvoices, pendingInvoices, payments] = await Promise.all([
      prisma.client.count({ where: ws(workspaceId) }),
      prisma.project.count({ where: ws(workspaceId) }),
      prisma.task.count({ where: { ...ws(workspaceId), status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.invoice.findMany({
        where: { ...ws(workspaceId), status: { in: ['PENDING', 'OVERDUE', 'PAID'] } },
        include: { items: true },
      }),
      prisma.invoice.count({ where: { ...ws(workspaceId), status: { in: ['PENDING', 'OVERDUE'] } } }),
      prisma.payment.aggregate({ where: ws(workspaceId), _sum: { amount: true } }),
    ])
    let received = 0
    let outstanding = 0
    for (const inv of paidInvoices) {
      const t = computeInvoiceTotals(itemsToLines(inv.items), Number(inv.taxRate), Number(inv.discount)).total
      if (inv.status === 'PAID') received += t
      else outstanding += t
    }
    return {
      ok: true,
      text: JSON.stringify({
        clients,
        projects,
        openTasks,
        outstandingInvoices: pendingInvoices,
        revenueReceived: Math.round(received * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        totalPaymentsRecorded: Number(payments._sum.amount ?? 0),
      }),
    }
  },

  async get_activity({ workspaceId }, args) {
    const rows = await prisma.activity.findMany({
      where: ws(workspaceId),
      orderBy: { createdAt: 'desc' },
      take: args.limit,
    })
    return {
      ok: true,
      text: JSON.stringify(rows.map((a) => ({ kind: a.kind, text: a.text, detail: a.detail, createdAt: a.createdAt }))),
    }
  },

  async create_client({ workspaceId }, args) {
    const client = await prisma.client.create({
      data: { workspaceId, ...args },
      select: { id: true, name: true, company: true, email: true, status: true },
    })
    await recordActivity({
      workspaceId,
      kind: 'CLIENT_CREATED',
      text: `Client ${client.company} created`,
      clientId: client.id,
    })
    return { ok: true, text: JSON.stringify({ created: client }) }
  },

  async update_client({ workspaceId }, args) {
    const { id, ...rest } = args
    const client = await prisma.client.findFirst({ where: { id, workspaceId } })
    if (!client) return { ok: false, text: 'Client not found.' }
    const updated = await prisma.client.update({ where: { id }, data: rest, select: { id: true, name: true, company: true, status: true } })
    await recordActivity({ workspaceId, kind: 'CLIENT_UPDATED', text: `Client ${updated.company} updated`, clientId: updated.id })
    return { ok: true, text: JSON.stringify({ updated }) }
  },

  async create_project({ workspaceId }, args) {
    if (args.clientId) {
      const client = await prisma.client.findFirst({ where: { id: args.clientId, workspaceId }, select: { id: true } })
      if (!client) return { ok: false, text: `Client ${args.clientId} not found in this workspace.` }
    }
    const project = await prisma.project.create({
      data: {
        workspaceId,
        name: args.name,
        clientId: args.clientId ?? null,
        description: args.description ?? null,
        status: args.status,
        progress: args.progress,
        budget: args.budget,
        deadline: args.deadline ? new Date(args.deadline) : null,
      },
      select: { id: true, name: true, status: true, clientId: true },
    })
    await recordActivity({ workspaceId, kind: 'PROJECT_CREATED', text: `Project ${project.name} created`, projectId: project.id })
    return { ok: true, text: JSON.stringify({ created: project }) }
  },

  async update_project({ workspaceId }, args) {
    const { id, ...rest } = args
    const project = await prisma.project.findFirst({ where: { id, workspaceId } })
    if (!project) return { ok: false, text: 'Project not found.' }
    const updated = await prisma.project.update({
      where: { id },
      data: { ...rest, ...(rest.deadline !== undefined ? { deadline: rest.deadline ? new Date(rest.deadline) : null } : {}) },
      select: { id: true, name: true, status: true, progress: true },
    })
    await recordActivity({ workspaceId, kind: 'PROJECT_UPDATED', text: `Project ${updated.name} updated`, projectId: updated.id })
    return { ok: true, text: JSON.stringify({ updated }) }
  },

  async create_task({ workspaceId }, args) {
    if (args.projectId) {
      const project = await prisma.project.findFirst({ where: { id: args.projectId, workspaceId }, select: { id: true } })
      if (!project) return { ok: false, text: `Project ${args.projectId} not found in this workspace.` }
    }
    const task = await prisma.task.create({
      data: {
        workspaceId,
        title: args.title,
        description: args.description ?? null,
        projectId: args.projectId ?? null,
        priority: args.priority,
        status: args.status,
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        completedAt: args.status === 'COMPLETED' ? new Date() : null,
      },
      select: { id: true, title: true, status: true, priority: true },
    })
    await recordActivity({
      workspaceId,
      kind: args.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_CREATED',
      text: args.status === 'COMPLETED' ? `Task ${task.title} completed` : `Task ${task.title} created`,
      taskId: task.id,
    })
    return { ok: true, text: JSON.stringify({ created: task }) }
  },

  async update_task({ workspaceId }, args) {
    const { id, ...rest } = args
    const task = await prisma.task.findFirst({ where: { id, workspaceId } })
    if (!task) return { ok: false, text: 'Task not found.' }
    const status = rest.status
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.dueDate !== undefined ? { dueDate: rest.dueDate ? new Date(rest.dueDate) : null } : {}),
        ...(status === 'COMPLETED' && task.status !== 'COMPLETED' ? { completedAt: new Date() } : {}),
        ...(status !== undefined && status !== 'COMPLETED' ? { completedAt: null } : {}),
      },
      select: { id: true, title: true, status: true, priority: true },
    })
    await recordActivity({
      workspaceId,
      kind: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
      text: status === 'COMPLETED' ? `Task ${updated.title} completed` : `Task ${updated.title} updated`,
      taskId: updated.id,
    })
    return { ok: true, text: JSON.stringify({ updated }) }
  },

  async create_invoice({ workspaceId }, args) {
    const client = await prisma.client.findFirst({ where: { id: args.clientId, workspaceId }, select: { id: true, company: true } })
    if (!client) return { ok: false, text: `Client ${args.clientId} not found in this workspace.` }
    const number = await nextInvoiceNumber(workspaceId)
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          workspaceId,
          clientId: client.id,
          number,
          status: 'DRAFT',
          issueDate: new Date(args.issueDate),
          dueDate: new Date(args.dueDate),
          taxRate: args.taxRate,
          discount: args.discount,
          note: args.note ?? null,
          items: { create: args.items },
        },
        select: { id: true, number: true, status: true, dueDate: true },
      })
      await tx.activity.create({
        data: { workspaceId, kind: 'INVOICE_CREATED', text: `Invoice ${created.number} created`, detail: client.company, invoiceId: created.id, clientId: client.id },
      })
      return created
    })
    return { ok: true, text: JSON.stringify({ created: invoice }) }
  },

  async update_invoice_status({ workspaceId }, args) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: args.id, workspaceId },
      include: { items: true, payments: true },
    })
    if (!invoice) return { ok: false, text: 'Invoice not found.' }
    if (args.status === 'PAID') {
      const totals = computeInvoiceTotals(itemsToLines(invoice.items), Number(invoice.taxRate), Number(invoice.discount))
      const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0)
      const remaining = Math.max(0, totals.total - paid)
      if (remaining > 0.005) {
        return { ok: false, text: `Cannot mark paid: ${remaining.toFixed(2)} is still outstanding. Suggest recording a payment instead.` }
      }
      const updated = await markInvoicePaid(workspaceId, args.id, { amount: remaining, method: 'OTHER' })
      return { ok: true, text: JSON.stringify({ updated: { id: updated.id, number: updated.number, status: updated.status } }) }
    }
    const from = invoice.status
    if (args.status === from) return { ok: true, text: `Invoice is already ${args.status}.` }
    if (from === 'PAID' || from === 'CANCELLED') {
      return { ok: false, text: `Cannot change an invoice that is ${from.toLowerCase()}.` }
    }
    const updated = await prisma.invoice.update({
      where: { id: args.id },
      data: { status: args.status, ...(args.status === 'PENDING' && !invoice.sentAt ? { sentAt: new Date() } : {}) },
      select: { id: true, number: true, status: true },
    })
    await recordActivity({
      workspaceId,
      kind: 'INVOICE_UPDATED',
      text: `Invoice ${updated.number} ${args.status.toLowerCase()}`,
      detail: `Status changed from ${from}`,
      invoiceId: updated.id,
      clientId: invoice.clientId,
    })
    return { ok: true, text: JSON.stringify({ updated }) }
  },
}

export async function runTool(name: ToolName, ctx: ToolContext, rawArgs: unknown): Promise<ToolResult> {
  const schema = toolParamSchemas[name]
  let args: unknown
  try {
    args = schema.parse(rawArgs)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, text: `Invalid arguments for ${name}: ${err.issues.map((i) => i.message).join('; ')}` }
    }
    throw err
  }
  return toolExecutors[name](ctx, args)
}

export function describeAction(name: ToolName, rawArgs: unknown): string {
  const args = rawArgs as Record<string, unknown>
  switch (name) {
    case 'create_client':
      return `Create client "${args.company ?? args.name}"`
    case 'update_client':
      return `Update client ${args.id}`
    case 'create_project':
      return `Create project "${args.name}"`
    case 'update_project':
      return `Update project ${args.id}`
    case 'create_task':
      return `Create task "${args.title}"`
    case 'update_task':
      return `Update task ${args.id}`
    case 'create_invoice':
      return `Create invoice for client ${args.clientId} with ${(args.items as unknown[] | undefined)?.length ?? 0} line item(s)`
    case 'update_invoice_status':
      return `Mark invoice ${args.id} as ${args.status}`
    default:
      return `Run ${name}`
  }
}
