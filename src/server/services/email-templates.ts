import { emailShell } from '@/server/services/email'
import { escapeHtml, fmt, formatDate } from '@/lib/utils'

interface InvoiceEmailCtx {
  number: string
  amount: number
  clientName: string
  issueDate: Date
  dueDate: Date
}

export function invoiceCreatedEmail(ctx: InvoiceEmailCtx): { subject: string; html: string } {
  const number = escapeHtml(ctx.number)
  const clientName = escapeHtml(ctx.clientName)
  return {
    subject: `Invoice ${ctx.number} from VANTA`,
    html: emailShell({
      title: `Invoice ${number}`,
      body: `
        <h1 style="font-size:18px;margin:0 0 12px;color:#f4f3ef;">New invoice: ${number}</h1>
        <p style="font-size:14px;line-height:1.7;color:#a6a6b0;margin:0 0 20px;">
          Hi ${clientName}, a new invoice has been created in your workspace.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#f4f3ef;margin-bottom:20px;">
          <tr><td style="padding:6px 0;color:#686872;">Amount</td><td style="padding:6px 0;text-align:right;font-weight:600;">${fmt(ctx.amount)}</td></tr>
          <tr><td style="padding:6px 0;color:#686872;">Issued</td><td style="padding:6px 0;text-align:right;">${formatDate(ctx.issueDate)}</td></tr>
          <tr><td style="padding:6px 0;color:#686872;">Due</td><td style="padding:6px 0;text-align:right;">${formatDate(ctx.dueDate)}</td></tr>
        </table>
        <a href="{{VIEW_URL}}" style="display:inline-block;background:#c8a96b;color:#0b0b0e;font-weight:600;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">View invoice</a>`,
    }),
  }
}

export function invoicePaidEmail(ctx: InvoiceEmailCtx): { subject: string; html: string } {
  const number = escapeHtml(ctx.number)
  return {
    subject: `Payment received — ${ctx.number}`,
    html: emailShell({
      title: 'Payment received',
      body: `
        <h1 style="font-size:18px;margin:0 0 12px;color:#f4f3ef;">${number} has been paid</h1>
        <p style="font-size:14px;line-height:1.7;color:#a6a6b0;margin:0 0 20px;">
          A payment of <strong style="color:#f4f3ef;">${fmt(ctx.amount)}</strong> was recorded for invoice ${number}.
        </p>`,
    }),
  }
}

export function invoiceOverdueEmail(ctx: InvoiceEmailCtx): { subject: string; html: string } {
  const number = escapeHtml(ctx.number)
  const clientName = escapeHtml(ctx.clientName)
  return {
    subject: `Payment reminder — ${ctx.number}`,
    html: emailShell({
      title: 'Payment reminder',
      body: `
        <h1 style="font-size:18px;margin:0 0 12px;color:#f4f3ef;">Invoice ${number} is overdue</h1>
        <p style="font-size:14px;line-height:1.7;color:#a6a6b0;margin:0 0 20px;">
          ${clientName}, a friendly reminder that invoice ${number} for
          <strong style="color:#f4f3ef;">${fmt(ctx.amount)}</strong> was due on ${formatDate(ctx.dueDate)}.
          Could you arrange payment at your earliest convenience?
        </p>`,
    }),
  }
}
