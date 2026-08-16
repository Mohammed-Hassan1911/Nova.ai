import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Reuse a single PrismaClient per function instance in every environment
// (including production) so Vercel serverless invocations never spin up
// extra connection pools. globalThis persists across warm invocations.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

globalForPrisma.prisma = prisma
