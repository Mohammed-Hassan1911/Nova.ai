import { z } from 'zod'

const email = z
  .string({ message: 'Email is required.' })
  .trim()
  .email('Enter a valid email address.')
  .max(255, 'Email is too long.')
  .transform((v) => v.toLowerCase())

const password = z
  .string({ message: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')

const idParam = z.string().min(1)

const optionalDate = z
  .string()
  .optional()
  .refine((v) => v === undefined || v === '' || !Number.isNaN(Date.parse(v)), {
    message: 'Invalid date.',
  })
  .transform((v) => (v ? new Date(v) : null))

const date = optionalDate.refine((v): v is Date => v !== null, { message: 'A date is required.' })

// ------------------------------ auth --------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120, 'Name is too long.'),
  email,
  password,
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  password,
})

// ---------------------------- onboarding ----------------------------

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters.').max(120, 'Name is too long.'),
  businessType: z
    .enum(['FREELANCER', 'AGENCY', 'CONSULTANT', 'SMALL_BUSINESS', 'OTHER'])
    .optional(),
})

// ------------------------------ clients ------------------------------

const clientStatus = z.enum(['ACTIVE', 'PROSPECT', 'INACTIVE'])

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty.').max(120, 'Name is too long.'),
  company: z.string().trim().min(1, 'Company cannot be empty.').max(120, 'Company is too long.'),
  email: email.optional().nullable(),
  phone: z.string().trim().max(60, 'Phone is too long.').optional().nullable(),
  status: clientStatus.default('ACTIVE'),
  notes: z.string().max(4000, 'Notes are too long.').optional().nullable(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: idParam.optional(),
})

export const clientParamsSchema = z.object({ id: idParam })

// ------------------------------ projects -----------------------------

const projectStatus = z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED'])

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.').max(160, 'Name is too long.'),
  clientId: idParam.optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  status: projectStatus.default('ON_TRACK'),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  budget: z.coerce.number().min(0).default(0),
  spent: z.coerce.number().min(0).default(0),
  deadline: optionalDate,
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: idParam.optional(),
})

export const projectParamsSchema = z.object({ id: idParam })

// ------------------------------- tasks -------------------------------

const taskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH'])
const taskStatus = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED'])

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.').max(200, 'Title is too long.'),
  description: z.string().max(4000).optional().nullable(),
  projectId: idParam.optional().nullable(),
  priority: taskPriority.default('MEDIUM'),
  status: taskStatus.default('TODO'),
  dueDate: optionalDate,
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: idParam.optional(),
})

export const taskParamsSchema = z.object({ id: idParam })

// ------------------------------ invoices ------------------------------

const invoiceStatus = z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'])
const currency = z.enum(['USD', 'EUR', 'GBP']).default('USD')

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'Line item description is required.').max(300),
  quantity: z.coerce.number().positive('Quantity must be greater than zero.'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative.'),
})

export const createInvoiceSchema = z.object({
  clientId: idParam,
  issueDate: date,
  dueDate: date,
  currency,
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).default(0),
  note: z.string().max(4000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one line item.').max(100),
})

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: idParam.optional(),
})

export const invoiceParamsSchema = z.object({ id: idParam })

export const invoiceStatusSchema = z.object({
  status: invoiceStatus,
})

// ------------------------------ payments ------------------------------

export const createPaymentSchema = z.object({
  invoiceId: idParam,
  amount: z.coerce.number().positive('Payment amount must be greater than zero.'),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'CASH', 'OTHER']).default('OTHER'),
  paidAt: optionalDate,
})

// ---------------------------- notifications ---------------------------

export const notificationIdsSchema = z.object({
  ids: z.array(idParam).min(1, 'Select at least one notification.'),
})

// -------------------------------- AI ---------------------------------

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty.').max(4000, 'Message is too long.'),
  conversationId: idParam.optional().nullable(),
})

export const aiConfirmSchema = z.object({
  conversationId: idParam,
  toolName: z.string().min(1),
  args: z.record(z.unknown()),
})

export const aiConversationParamsSchema = z.object({ id: idParam })
