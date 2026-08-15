import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const USD = (cents: number) => new Prisma.Decimal(cents / 100)
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

async function main() {
  const email = process.env.SEED_EMAIL ?? 'demo@nova.app'
  const password = process.env.SEED_PASSWORD ?? 'nova-demo-password'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Seed: user ${email} already exists, skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name: 'Demo Owner',
      email,
      emailVerified: new Date(),
      passwordHash,
    },
  })

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Atlas Studio',
      businessType: 'AGENCY',
      nextInvoiceNumber: 1000,
      members: {
        create: [{ userId: user.id, role: 'OWNER' }],
      },
    },
  })

  const workspaceId = workspace.id

  const [northwind, helios, bevel, redwood] = await Promise.all([
    prisma.client.create({
      data: {
        workspaceId,
        name: 'Maya Chen',
        company: 'Northwind Digital',
        email: 'maya@northwind.co',
        phone: '+1 (415) 555-0132',
        status: 'ACTIVE',
        notes: 'Retainer client since 2024. Prefers async updates and weekly summaries.',
      },
    }),
    prisma.client.create({
      data: {
        workspaceId,
        name: 'Jonas Keller',
        company: 'Helios Health',
        email: 'jonas@helios.health',
        phone: '+49 30 555 0194',
        status: 'ACTIVE',
        notes: 'Compliance-heavy project. Invoice on the 1st of each month.',
      },
    }),
    prisma.client.create({
      data: {
        workspaceId,
        name: 'Priya Nair',
        company: 'Bevel & Co',
        email: 'priya@bevelco.com',
        status: 'PROSPECT',
        notes: 'Interested in a full rebrand. Follow up after launch.',
      },
    }),
    prisma.client.create({
      data: {
        workspaceId,
        name: 'Sam Okafor',
        company: 'Redwood Logistics',
        email: 'sam@redwoodlog.com',
        phone: '+1 (312) 555-0177',
        status: 'INACTIVE',
        notes: 'Paused engagement. Archive invoices for tax season.',
      },
    }),
  ])

  const [rebrand, carePortal, marketingSite] = await Promise.all([
    prisma.project.create({
      data: {
        workspaceId,
        clientId: northwind.id,
        name: 'Website Redesign',
        description: 'Full redesign of the Northwind marketing site with a new CMS.',
        status: 'ON_TRACK',
        progress: 65,
        budget: USD(1800000),
        spent: USD(1120000),
        deadline: daysFromNow(21),
      },
    }),
    prisma.project.create({
      data: {
        workspaceId,
        clientId: helios.id,
        name: 'Care Portal v2',
        description: 'Patient portal with secure messaging and appointment booking.',
        status: 'AT_RISK',
        progress: 40,
        budget: USD(2500000),
        spent: USD(980000),
        deadline: daysFromNow(35),
      },
    }),
    prisma.project.create({
      data: {
        workspaceId,
        clientId: bevel.id,
        name: 'Landing Page Proposal',
        description: 'Initial scoping for a Bevel landing page.',
        status: 'COMPLETED',
        progress: 100,
        budget: USD(50000),
        spent: USD(50000),
        deadline: daysFromNow(-10),
      },
    }),
  ])

  await Promise.all([
    prisma.task.createMany({
      data: [
        {
          workspaceId,
          projectId: rebrand.id,
          title: 'Finalize hero section copy',
          description: 'Settle on the new tagline with Maya.',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: daysFromNow(1),
        },
        {
          workspaceId,
          projectId: rebrand.id,
          title: 'Deliver homepage mockups',
          priority: 'HIGH',
          status: 'TODO',
          dueDate: daysFromNow(4),
        },
        {
          workspaceId,
          projectId: carePortal.id,
          title: 'Wire up secure messaging',
          description: 'End-to-end encrypted inbox for patients.',
          priority: 'MEDIUM',
          status: 'TODO',
          dueDate: daysFromNow(7),
        },
        {
          workspaceId,
          projectId: carePortal.id,
          title: 'Schedule usability testing',
          priority: 'LOW',
          status: 'COMPLETED',
          completedAt: daysFromNow(-2),
        },
        {
          workspaceId,
          title: 'Send Q3 invoice summary',
          priority: 'MEDIUM',
          status: 'TODO',
          dueDate: daysFromNow(2),
        },
      ],
    }),
  ])

  const inv1 = await prisma.invoice.create({
    data: {
      workspaceId,
      clientId: northwind.id,
      number: 'INV-1000',
      status: 'PAID',
      issueDate: daysFromNow(-30),
      dueDate: daysFromNow(-2),
      taxRate: USD(0),
      note: 'Website redesign — milestone 1.',
      sentAt: daysFromNow(-30),
      paidAt: daysFromNow(-3),
      items: {
        create: [
          { description: 'Discovery & strategy workshops', quantity: USD(2), unitPrice: USD(125000) },
          { description: 'UI/UX design — 6 screens', quantity: USD(1), unitPrice: USD(85000) },
        ],
      },
    },
  })

  const inv2 = await prisma.invoice.create({
    data: {
      workspaceId,
      clientId: helios.id,
      number: 'INV-1001',
      status: 'PENDING',
      issueDate: daysFromNow(-14),
      dueDate: daysFromNow(16),
      taxRate: USD(1900),
      sentAt: daysFromNow(-14),
      items: {
        create: [
          { description: 'Care portal — dev sprint 4', quantity: USD(1), unitPrice: USD(240000) },
          { description: 'Infrastructure & hosting', quantity: USD(1), unitPrice: USD(60000) },
        ],
      },
    },
  })

  const inv3 = await prisma.invoice.create({
    data: {
      workspaceId,
      clientId: redwood.id,
      number: 'INV-1002',
      status: 'OVERDUE',
      issueDate: daysFromNow(-45),
      dueDate: daysFromNow(-15),
      taxRate: USD(0),
      sentAt: daysFromNow(-45),
      overdueNotifiedAt: daysFromNow(-10),
      items: {
        create: [{ description: 'Logistics dashboard build', quantity: USD(1), unitPrice: USD(155000) }],
      },
    },
  })

  await prisma.payment.createMany({
    data: [
      {
        workspaceId,
        invoiceId: inv1.id,
        amount: USD(335000),
        method: 'BANK_TRANSFER',
        paidAt: daysFromNow(-3),
      },
    ],
  })

  await prisma.activity.createMany({
    data: [
      {
        workspaceId,
        kind: 'CLIENT_CREATED',
        text: 'Added Northwind Digital as a client',
        clientId: northwind.id,
        createdAt: daysFromNow(-31),
      },
      {
        workspaceId,
        kind: 'INVOICE_PAID',
        text: 'Invoice INV-1000 was paid',
        invoiceId: inv1.id,
        createdAt: daysFromNow(-3),
      },
      {
        workspaceId,
        kind: 'INVOICE_OVERDUE',
        text: 'Invoice INV-1002 is overdue',
        invoiceId: inv3.id,
        createdAt: daysFromNow(-15),
      },
      {
        workspaceId,
        kind: 'TASK_COMPLETED',
        text: 'Scheduled usability testing',
        projectId: carePortal.id,
        createdAt: daysFromNow(-2),
      },
      {
        workspaceId,
        kind: 'PROJECT_COMPLETED',
        text: 'Landing Page Proposal completed',
        projectId: marketingSite.id,
        createdAt: daysFromNow(-10),
      },
    ],
  })

  await prisma.notification.createMany({
    data: [
      {
        workspaceId,
        kind: 'INVOICE_PAID',
        title: 'Payment received',
        detail: 'INV-1000 was paid via bank transfer.',
        link: '/invoices',
        createdAt: daysFromNow(-3),
      },
      {
        workspaceId,
        kind: 'INVOICE_OVERDUE',
        title: 'Invoice overdue',
        detail: 'INV-1002 from Redwood Logistics is 15 days overdue.',
        link: '/invoices',
        createdAt: daysFromNow(-15),
      },
      {
        workspaceId,
        kind: 'TASK_DUE',
        title: 'Task due soon',
        detail: 'Finalize hero section copy is due tomorrow.',
        link: '/tasks',
        createdAt: daysFromNow(0),
      },
    ],
  })

  console.log('Seed complete.')
  console.log(`  Login:   ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Workspace: ${workspace.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
