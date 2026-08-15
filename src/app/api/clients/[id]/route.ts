import { prisma } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { requireWorkspaceContext, requireAdmin, requireOwner } from '@/lib/workspace'
import { updateClientSchema, clientParamsSchema } from '@/lib/validation/schemas'
import { recordActivity } from '@/server/services/activity'

type Params = { id: string }

export const GET = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const { workspace } = await requireWorkspaceContext()
  const { id } = clientParamsSchema.parse(await ctx.params)

  const client = await prisma.client.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      projects: { orderBy: { createdAt: 'desc' } },
      invoices: { include: { payments: true }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!client) throw new ApiError('NOT_FOUND', 'Client not found.', 404)

  return ok({ client })
})

export const PATCH = api(async (req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireAdmin(authCtx)
  const { workspace } = authCtx
  const { id } = clientParamsSchema.parse(await ctx.params)
  const body = await parseBody(req, updateClientSchema)

  const existing = await prisma.client.findFirst({ where: { id, workspaceId: workspace.id } })
  if (!existing) throw new ApiError('NOT_FOUND', 'Client not found.', 404)

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.company !== undefined ? { company: body.company } : {}),
      ...(body.email !== undefined ? { email: body.email ?? null } : {}),
      ...(body.phone !== undefined ? { phone: body.phone ?? null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
    },
  })

  await recordActivity({
    workspaceId: workspace.id,
    kind: 'CLIENT_UPDATED',
    text: `Client updated — ${client.company}`,
    detail: `Status: ${client.status}`,
    clientId: client.id,
  })

  return ok({ client })
})

export const DELETE = api(async (_req: Request, ctx: { params: Promise<Params> }) => {
  const authCtx = await requireWorkspaceContext()
  requireOwner(authCtx)
  const { workspace } = authCtx
  const { id } = clientParamsSchema.parse(await ctx.params)

  const existing = await prisma.client.findFirst({ where: { id, workspaceId: workspace.id } })
  if (!existing) throw new ApiError('NOT_FOUND', 'Client not found.', 404)

  await prisma.$transaction(async (tx) => {
    // Cascade deletes invoices; invoices must be removed before the client.
    await tx.invoice.deleteMany({ where: { clientId: id } })
    await tx.client.delete({ where: { id } })
    await tx.activity.create({
      data: {
        workspaceId: workspace.id,
        kind: 'CLIENT_DELETED',
        text: `Client deleted — ${existing.company}`,
        detail: 'Removed with related invoices.',
      },
    })
  })

  return ok({ deleted: true })
})
