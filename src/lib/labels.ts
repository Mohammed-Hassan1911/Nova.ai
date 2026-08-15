import type {
  ClientStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  InvoiceStatus,
} from '@/lib/types'

export const clientStatusLabel: Record<ClientStatus, string> = {
  ACTIVE: 'Active',
  PROSPECT: 'Prospect',
  INACTIVE: 'Inactive',
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  ON_TRACK: 'On track',
  AT_RISK: 'At risk',
  BEHIND: 'Behind',
  COMPLETED: 'Completed',
}

export const taskPriorityLabel: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
}

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
}

export const businessTypeLabel: Record<string, string> = {
  FREELANCER: 'Freelancer',
  AGENCY: 'Agency',
  CONSULTANT: 'Consultant',
  SMALL_BUSINESS: 'Small business',
  OTHER: 'Something else',
}
