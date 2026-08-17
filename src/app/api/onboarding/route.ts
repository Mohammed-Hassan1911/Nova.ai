import { prisma, prismaQuery } from '@/lib/prisma'
import { api, ok, parseBody } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { getSessionUser, invalidateWorkspaceCache } from '@/lib/workspace'
import { createWorkspaceSchema } from '@/lib/validation/schemas'

export const POST = api(async (req: Request) => {
  const user = await getSessionUser()
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Your session has expired. Please sign in again.', 401)

  const body = await parseBody(req, createWorkspaceSchema)

  const existing = await prismaQuery(() =>
    prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { id: true },
    }),
  )
  if (existing) {
    throw new ApiError('WORKSPACE_EXISTS', 'You already have a workspace.', 409)
  }

  const workspace = await prismaQuery(() =>
    prisma.workspace.create({
      data: {
        name: body.name,
        businessType: body.businessType ?? null,
        businessTypeCustom: body.businessTypeCustom ?? null,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
      select: { id: true, name: true, businessType: true, businessTypeCustom: true, createdAt: true },
    }),
  )

  // Invalidate workspace cache so subsequent requests pick up the new workspace
  invalidateWorkspaceCache(user.id)

  return ok({ workspace }, { status: 201 })
})
