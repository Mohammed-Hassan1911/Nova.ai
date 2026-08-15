export interface Pagination {
  page: number
  perPage: number
  total: number
  pages: number
}

export type ClientStatus = 'ACTIVE' | 'PROSPECT' | 'INACTIVE'
export type ProjectStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'OTHER'
export type BusinessType = 'FREELANCER' | 'AGENCY' | 'CONSULTANT' | 'SMALL_BUSINESS' | 'OTHER'

export interface Client {
  id: string
  name: string
  company: string
  email: string | null
  phone: string | null
  status: ClientStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { projects: number; invoices: number }
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  progress: number
  budget: number
  spent: number
  deadline: string | null
  clientId: string | null
  createdAt: string
  client?: { id: string; company: string } | null
  _count?: { tasks: number }
  tasks?: Task[]
}

export interface Task {
  id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  dueDate: string | null
  completedAt: string | null
  projectId: string | null
  createdAt: string
  project?: { id: string; name: string } | null
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  currency: string
  taxRate: number
  discount: number
  note: string | null
  sentAt: string | null
  paidAt: string | null
  createdAt: string
  clientId: string
  client?: { id: string; company: string; name: string; email: string | null } | null
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  paid: number
  balance: number
  overdue: boolean
}

export interface Payment {
  id: string
  invoiceId: string
  invoice?: { id: string; number: string; status: InvoiceStatus }
  amount: number
  method: PaymentMethod
  paidAt: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  kind: string
  title: string
  detail: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

export interface ActivityItem {
  id: string
  kind: string
  text: string
  detail: string | null
  createdAt: string
}

export interface DashboardData {
  metrics: {
    revenue: { received: number; outstanding: number; overdue: number; statusBreakdown: Record<string, number> }
    clients: number
    projects: number
    tasks: { open: number; completed: number }
  }
  revenueByMonth: { month: string; total: number }[]
  recentActivity: ActivityItem[]
  overdueInvoices: { id: string; number: string; company: string; dueDate: string; balance: number }[]
}

export type AgentResult =
  | { kind: 'reply'; conversationId: string; content: string }
  | {
      kind: 'needsConfirmation'
      conversationId: string
      toolName: string
      args: Record<string, unknown>
      summary: string
      content: string
    }
  | { kind: 'unconfigured'; conversationId: string; content: string }

export interface Conversation {
  id: string
  title: string | null
  updatedAt: string
  createdAt: string
  messages: { id: string; role: string; content: string; toolName: string | null; createdAt: string }[]
}
