# NOVA

A dark, premium multi-tenant SaaS for freelancers and small studios — clients, projects, tasks, invoicing, payments, PDFs, email, and an AI assistant that acts on your data (with human confirmation for writes).

Next.js (App Router) · TypeScript · Prisma/PostgreSQL · Auth.js · Tailwind v4 · OpenAI · Resend · @react-pdf/renderer.

## Features

- **Auth** — email/password (bcrypt) with Auth.js credentials + optional Google OAuth; forgot/reset password; JWT sessions; rate-limited routes.
- **Workspaces** — every business record is scoped to a workspace derived server-side; clients never supply a workspace id. Invite-ready `WorkspaceMember` model.
- **CRM** — clients, projects, tasks with status/priority, search and filters.
- **Invoicing** — line-item invoices, tax/discount math in integer cents, atomic per-workspace invoice numbers (`INV-1000`), partial-payment-aware status transitions (DRAFT → PENDING → PAID/OVERDUE/CANCELLED), auto-sweep of overdue invoices, PDF generation, send-by-email.
- **Activity & notifications** — immutable audit trail (`Activity`) plus unread notifications with links and read-tracking.
- **AI assistant** — OpenAI agent with 14 tools (list/get/create/update across clients, projects, tasks, invoices; metrics; activity). Reads answer immediately; **writes are gated behind a confirmation step** shown in the UI. Conversations are persisted and resumable.
- **Dashboard** — revenue by month, outstanding/overdue totals, recent activity, invoice status breakdown.

## Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 16, React 19, App Router                    |
| Database   | PostgreSQL + Prisma 6                                |
| Auth       | Auth.js (next-auth v5 beta), credentials + Google    |
| Validation | zod 3                                                |
| AI         | openai SDK — OpenAI or Gemini (OpenAI-compatible endpoint) |
| Email      | resend                                               |
| PDFs       | @react-pdf/renderer                                  |
| Styling    | Tailwind v4, framer-motion, lucide-react             |
| Tests      | vitest                                               |

## Getting started

```bash
# 1. install
npm install

# 2. copy env and fill in DATABASE_URL (see .env.example)
cp .env.example .env

# 3. migrate + generate client
npm run db:migrate

# 4. optional: demo data (demo@nova.app / nova-demo-password)
npm run db:seed

# 5. run
npm run dev            # http://localhost:3000
```

Optional features activate when their env vars are present:
- **AI**: set `GEMINI_API_KEY` (default model `gemini-3.7-flash`, from https://aistudio.google.com/apikey) or `OPENAI_API_KEY` (default `gpt-4o-mini`). Gemini takes priority when both are set. Without either, the assistant answers with a friendly "AI is not configured" message.
- **Email**: set `RESEND_API_KEY` + `EMAIL_FROM`. Without them, send/send-reminders silently skip emailing.
- **Google login**: set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and `NEXT_PUBLIC_GOOGLE_ENABLED="true"` to show the button.
- **Production**: set `AUTH_URL` to your deployed origin.

## Scripts

| Command                | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the dev server                    |
| `npm run build`        | Production build                        |
| `npm run start`        | Serve the production build              |
| `npm run typecheck`    | `tsc --noEmit`                          |
| `npm test`             | Run vitest unit tests                   |
| `npm run db:migrate`   | `prisma migrate dev`                    |
| `npm run db:deploy`    | Apply migrations (prod)                 |
| `npm run db:seed`      | Seed demo data (idempotent)             |

## Project layout

```
src/
  app/
    (app)/                  # authenticated app pages (guarded by (app)/layout.tsx)
      dashboard/ clients/ projects/ tasks/ invoices/ assistant/ settings/
    (auth)/                 # login / signup / forgot / reset (guarded)
    api/                    # REST API routes
  components/
    ui/                     # Button, Input, Select, Modal, Toast, StatusBadge, …
    layout/                 # AppShell, Sidebar, Topbar, MobileNav
    modals/                 # AddClient, AddProject, AddTask, CreateInvoice
  lib/                      # types, client (apiFetch), money, labels, errors, workspace
  server/
    services/               # invoices (math/transitions), pdf, email-templates, activity
    ai/                     # tools registry + agent loop + confirmation flow
  middleware.ts             # auth-aware route guard
prisma/schema.prisma        # data model + migration
```

## Security model

- All business queries are scoped with `requireWorkspaceContext()` which resolves the workspace from the authenticated session — never from request input.
- Financial math runs in integer cents server-side (`src/lib/money.ts`); `computeInvoiceTotals` is the single source of truth.
- Invoice numbers are allocated atomically via `Workspace.nextInvoiceNumber` and unique per workspace.
- Auth routes are rate-limited; passwords are bcrypt-hashed; AI writes require explicit user confirmation.

## Roadmap / notes

- Storage env vars (`S3_*`) are reserved but not yet wired — invoice PDFs are currently generated on demand.
- Notifications are workspace-wide; per-user notification routing can be added on top of `WorkspaceMember`.
- Unit tests cover money math, invoice totals/transitions/serialization, and AI tool argument parsing. Add a CI step to run `npm run typecheck && npm test`.
