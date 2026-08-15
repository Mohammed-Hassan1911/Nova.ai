import { prisma } from '@/lib/prisma'
import type { ActivityKind, Prisma } from '@prisma/client'

/**
 * Records a workspace-scoped activity event. Wrapped so it can run inside an
 * existing transaction or as its own statement.
 */
export async function recordActivity(
  input: {
    workspaceId: string
    kind: ActivityKind
    text: string
    detail?: string | null
    clientId?: string | null
    projectId?: string | null
    invoiceId?: string | null
    taskId?: string | null
  },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const db = tx ?? prisma
  await db.activity.create({ data: input })
}
