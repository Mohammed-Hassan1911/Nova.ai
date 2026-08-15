/* ------------------------------------------------------------------ */
/* NOVA — mock business data                                           */
/* ------------------------------------------------------------------ */

export type ClientStatus = 'Active' | 'Prospect' | 'Inactive'
export type ProjectStatus = 'On track' | 'At risk' | 'Behind' | 'Completed'
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export interface Client {
  id: string
  name: string
  company: string
  initials: string
  email: string
  phone: string
  status: ClientStatus
  revenue: number
  since: string
  lastActivity: string
  notes: string
}

export interface Project {
  id: string
  name: string
  clientId: string
  progress: number
  deadline: string
  budget: number
  spent: number
  status: ProjectStatus
  description: string
}

export interface InvoiceLine {
  description: string
  quantity: number
  rate: number
}

export interface Invoice {
  id: string
  clientId: string
  amount: number
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  daysOverdue?: number
  items: InvoiceLine[]
  note: string
}

export interface Task {
  id: string
  title: string
  projectId: string | null
  priority: TaskPriority
  due: string
  done: boolean
  completedToday?: boolean
}

export interface ActivityItem {
  id: string
  kind: 'payment' | 'invoice' | 'project' | 'task' | 'client'
  text: string
  detail: string
  time: string
}

export interface NotificationItem {
  id: string
  kind: 'payment' | 'overdue' | 'project' | 'client'
  title: string
  detail: string
  time: string
}

export const currentUser = {
  name: 'Mohammed Hassan',
  firstName: 'Mohammed',
  email: 'mohammed@novaworks.io',
  company: 'Hassan Studio',
  role: 'Founder',
  plan: 'Pro',
  initials: 'MH',
}

/* ------------------------------- clients --------------------------- */

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Maya Chen',
    company: 'Acme Studio',
    initials: 'AC',
    email: 'maya.chen@acmestudio.io',
    phone: '+1 (415) 555-0134',
    status: 'Active',
    revenue: 24800,
    since: 'Mar 2025',
    lastActivity: '12 min ago',
    notes: 'Design agency scaling their client portfolio. Prefers quarterly retainers with a single point of contact.',
  },
  {
    id: 'c2',
    name: 'Jonas Weber',
    company: 'Vertex Labs',
    initials: 'VL',
    email: 'jonas@vertexlabs.dev',
    phone: '+49 30 555-0187',
    status: 'Active',
    revenue: 18450,
    since: 'Jun 2025',
    lastActivity: '2 hr ago',
    notes: 'SaaS platform startup. High velocity, weekly standups, wants progress visibility without ceremony.',
  },
  {
    id: 'c3',
    name: 'Elena Reyes',
    company: 'Northstar Media',
    initials: 'NM',
    email: 'elena.reyes@northstarmedia.com',
    phone: '+1 (212) 555-0176',
    status: 'Prospect',
    revenue: 0,
    since: 'Aug 2026',
    lastActivity: '1 day ago',
    notes: 'Content publisher exploring a website platform rebuild. Budget discussion scheduled for next week.',
  },
  {
    id: 'c4',
    name: 'David Okafor',
    company: 'Atlas Digital',
    initials: 'AD',
    email: 'david@atlasdigital.co',
    phone: '+44 20 555-0162',
    status: 'Active',
    revenue: 12300,
    since: 'Sep 2025',
    lastActivity: '5 hr ago',
    notes: 'Digital transformation consultancy. Values clear documentation and predictable delivery.',
  },
  {
    id: 'c5',
    name: 'Sofia Lindqvist',
    company: 'Lumina Co.',
    initials: 'LC',
    email: 'sofia@lumina.co',
    phone: '+46 8 555-0149',
    status: 'Inactive',
    revenue: 6500,
    since: 'Jan 2025',
    lastActivity: '2 mo ago',
    notes: 'Completed their brand identity engagement. Open to future work on their annual report.',
  },
  {
    id: 'c6',
    name: 'Theo Laurent',
    company: 'Copper & Pine',
    initials: 'CP',
    email: 'theo@copperandpine.studio',
    phone: '+1 (503) 555-0118',
    status: 'Active',
    revenue: 9720,
    since: 'Feb 2026',
    lastActivity: '3 hr ago',
    notes: 'Boutique furniture brand. Launching a direct-to-consumer campaign this quarter.',
  },
  {
    id: 'c7',
    name: 'Amara Diallo',
    company: 'Helios Group',
    initials: 'HG',
    email: 'amara@heliosgroup.co',
    phone: '+1 (646) 555-0125',
    status: 'Prospect',
    revenue: 0,
    since: 'Aug 2026',
    lastActivity: '4 days ago',
    notes: 'Real estate investment firm evaluating a fractional ownership platform.',
  },
]

/* ------------------------------- projects -------------------------- */

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    clientId: 'c1',
    progress: 68,
    deadline: '2026-09-18',
    budget: 12000,
    spent: 8160,
    status: 'On track',
    description: 'Full redesign of the Acme Studio marketing site — positioning, art direction, and build.',
  },
  {
    id: 'p2',
    name: 'Mobile App',
    clientId: 'c2',
    progress: 42,
    deadline: '2026-10-02',
    budget: 18000,
    spent: 9800,
    status: 'Behind',
    description: 'Cross-platform companion app for Vertex Labs with offline-first sync.',
  },
  {
    id: 'p3',
    name: 'Brand Identity',
    clientId: 'c5',
    progress: 100,
    deadline: '2026-07-24',
    budget: 6500,
    spent: 6500,
    status: 'Completed',
    description: 'Naming, logo system, and brand guidelines for Lumina Co.',
  },
  {
    id: 'p4',
    name: 'Cloud Migration',
    clientId: 'c4',
    progress: 55,
    deadline: '2026-09-04',
    budget: 9500,
    spent: 4200,
    status: 'On track',
    description: 'Move infrastructure to managed services with zero-downtime cutover.',
  },
  {
    id: 'p5',
    name: 'Marketing Campaign',
    clientId: 'c6',
    progress: 24,
    deadline: '2026-10-20',
    budget: 7400,
    spent: 1780,
    status: 'On track',
    description: 'Launch campaign for Copper & Pine — creative, landing pages, and paid social.',
  },
  {
    id: 'p6',
    name: 'Product Launch',
    clientId: 'c1',
    progress: 12,
    deadline: '2026-11-12',
    budget: 8400,
    spent: 940,
    status: 'On track',
    description: 'Pre-launch site and waitlist capture for Acme Studios next product line.',
  },
  {
    id: 'p7',
    name: 'Design System',
    clientId: 'c2',
    progress: 78,
    deadline: '2026-09-25',
    budget: 6800,
    spent: 5300,
    status: 'On track',
    description: 'Component library and tokens powering Vertex Labs internal tools.',
  },
  {
    id: 'p8',
    name: 'SEO & Content',
    clientId: 'c4',
    progress: 33,
    deadline: '2026-10-08',
    budget: 5200,
    spent: 1710,
    status: 'At risk',
    description: 'Technical SEO overhaul and editorial calendar for Atlas Digital blog.',
  },
  {
    id: 'p9',
    name: 'E-commerce Build',
    clientId: 'c6',
    progress: 8,
    deadline: '2026-12-01',
    budget: 11200,
    spent: 860,
    status: 'On track',
    description: 'Headless storefront for Copper & Pine with native payments.',
  },
  {
    id: 'p10',
    name: 'Analytics Platform',
    clientId: 'c1',
    progress: 61,
    deadline: '2026-09-11',
    budget: 6900,
    spent: 4210,
    status: 'At risk',
    description: 'Unified revenue reporting across Acme Studio campaigns.',
  },
]

/* ------------------------------- tasks ----------------------------- */

const day = 24 * 60 * 60 * 1000
const iso = (offset: number) =>
  new Date(Date.now() + offset * day).toISOString().slice(0, 10)

export const tasks: Task[] = [
  { id: 't1', title: 'Review mobile app wireframes', projectId: 'p2', priority: 'High', due: iso(0), done: false },
  { id: 't2', title: 'Send updated proposal to Atlas Digital', projectId: 'p4', priority: 'High', due: iso(0), done: false },
  { id: 't3', title: 'Prepare monthly business review', projectId: null, priority: 'Medium', due: iso(0), done: false },
  { id: 't4', title: 'Follow up on overdue invoice', projectId: null, priority: 'High', due: iso(1), done: false },
  { id: 't5', title: 'Invoice Acme Studio — Q3 retainer', projectId: 'p1', priority: 'Medium', due: iso(1), done: false },
  { id: 't6', title: 'Client call with Vertex Labs', projectId: 'p2', priority: 'High', due: iso(2), done: false },
  { id: 't7', title: 'Update pricing page copy', projectId: 'p1', priority: 'Low', due: iso(3), done: false },
  { id: 't8', title: 'Draft case study from Cloud Migration', projectId: 'p4', priority: 'Low', due: iso(5), done: false },
  { id: 't9', title: 'Confirm Northstar Media kickoff', projectId: null, priority: 'Medium', due: iso(4), done: false },
  { id: 't10', title: 'Send NDA to Northstar Media', projectId: null, priority: 'Medium', due: iso(-1), done: true, completedToday: true },
  { id: 't11', title: 'Publish SEO audit findings', projectId: 'p8', priority: 'Medium', due: iso(0), done: true, completedToday: true },
  { id: 't12', title: 'Backup project files', projectId: null, priority: 'Low', due: iso(0), done: true, completedToday: true },
  { id: 't13', title: 'Review design system tokens', projectId: 'p7', priority: 'Medium', due: iso(-2), done: true, completedToday: false },
  { id: 't14', title: 'Approve landing page hero', projectId: 'p5', priority: 'High', due: iso(-3), done: true, completedToday: false },
]

/* ------------------------------ invoices --------------------------- */

export const invoices: Invoice[] = [
  {
    id: 'INV-1042',
    clientId: 'c1',
    amount: 5600,
    issueDate: '2026-07-28',
    dueDate: '2026-08-11',
    status: 'Paid',
    items: [
      { description: 'Q3 retainers — Website Redesign sprint', quantity: 4, rate: 1200 },
      { description: 'Strategy workshop (4 hr)', quantity: 1, rate: 800 },
    ],
    note: 'Thank you for your continued partnership.',
  },
  {
    id: 'INV-1041',
    clientId: 'c2',
    amount: 4200,
    issueDate: '2026-07-25',
    dueDate: '2026-08-08',
    status: 'Paid',
    items: [
      { description: 'Mobile App development — milestone 2', quantity: 1, rate: 3600 },
      { description: 'Asset preparation', quantity: 1, rate: 600 },
    ],
    note: '',
  },
  {
    id: 'INV-1039',
    clientId: 'c4',
    amount: 3150,
    issueDate: '2026-07-18',
    dueDate: '2026-08-01',
    status: 'Paid',
    items: [
      { description: 'Cloud Migration audit & plan', quantity: 1, rate: 2500 },
      { description: 'Documentation', quantity: 1, rate: 650 },
    ],
    note: '',
  },
  {
    id: 'INV-1043',
    clientId: 'c1',
    amount: 780,
    issueDate: '2026-08-07',
    dueDate: '2026-08-21',
    status: 'Pending',
    items: [
      { description: 'Analytics Platform — weekly support', quantity: 3, rate: 260 },
    ],
    note: '',
  },
  {
    id: 'INV-1045',
    clientId: 'c6',
    amount: 920,
    issueDate: '2026-08-09',
    dueDate: '2026-08-23',
    status: 'Pending',
    items: [
      { description: 'Marketing Campaign — creative round 2', quantity: 2, rate: 460 },
    ],
    note: '',
  },
  {
    id: 'INV-1046',
    clientId: 'c2',
    amount: 1060,
    issueDate: '2026-08-04',
    dueDate: '2026-08-18',
    status: 'Pending',
    items: [
      { description: 'Design System — component audit', quantity: 1, rate: 1060 },
    ],
    note: '',
  },
  {
    id: 'INV-1047',
    clientId: 'c4',
    amount: 540,
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    status: 'Pending',
    items: [
      { description: 'SEO & Content — monthly retainer', quantity: 1, rate: 540 },
    ],
    note: '',
  },
  {
    id: 'INV-1040',
    clientId: 'c5',
    amount: 480,
    issueDate: '2026-07-20',
    dueDate: '2026-07-30',
    status: 'Overdue',
    daysOverdue: 14,
    items: [
      { description: 'Brand Identity — final deliverables', quantity: 1, rate: 480 },
    ],
    note: '',
  },
  {
    id: 'INV-1038',
    clientId: 'c1',
    amount: 260,
    issueDate: '2026-07-16',
    dueDate: '2026-07-26',
    status: 'Overdue',
    daysOverdue: 18,
    items: [
      { description: 'Reimbursables — hosting & assets', quantity: 1, rate: 260 },
    ],
    note: '',
  },
  {
    id: 'INV-1044',
    clientId: 'c6',
    amount: 240,
    issueDate: '2026-07-30',
    dueDate: '2026-08-08',
    status: 'Overdue',
    daysOverdue: 5,
    items: [
      { description: 'Design system usage license', quantity: 1, rate: 240 },
    ],
    note: '',
  },
]

/* ------------------------------- activity -------------------------- */

export const activity: ActivityItem[] = [
  { id: 'a1', kind: 'payment', text: 'Payment received from Acme Studio', detail: '$5,600 · INV-1042', time: '12 min ago' },
  { id: 'a2', kind: 'invoice', text: 'Invoice INV-1043 created', detail: 'Acme Studio · $780', time: '1 hr ago' },
  { id: 'a3', kind: 'project', text: 'Project “Cloud Migration” updated', detail: 'Progress moved to 55%', time: '2 hr ago' },
  { id: 'a4', kind: 'task', text: 'Task completed — “Publish SEO audit findings”', detail: 'Atlas Digital · SEO & Content', time: '3 hr ago' },
  { id: 'a5', kind: 'client', text: 'New client added — Copper & Pine', detail: 'Theo Laurent · Portland, OR', time: 'Yesterday' },
  { id: 'a6', kind: 'payment', text: 'Payment received from Vertex Labs', detail: '$4,200 · INV-1041', time: 'Yesterday' },
  { id: 'a7', kind: 'project', text: 'Project “Brand Identity” completed', detail: 'Lumina Co. · Final deliverables sent', time: '2 days ago' },
  { id: 'a8', kind: 'invoice', text: 'Invoice INV-1039 marked as paid', detail: 'Atlas Digital · $3,150', time: '3 days ago' },
]

export const notifications: NotificationItem[] = [
  { id: 'n1', kind: 'payment', title: 'Payment received', detail: '$5,600 from Acme Studio', time: '12 min ago' },
  { id: 'n2', kind: 'overdue', title: 'Invoice INV-1038 is overdue', detail: 'Acme Studio · 18 days past due', time: '1 hr ago' },
  { id: 'n3', kind: 'project', title: '3 projects due this week', detail: 'Website Redesign, Analytics Platform, Cloud Migration', time: '2 hr ago' },
  { id: 'n4', kind: 'client', title: 'New prospect', detail: 'Helios Group · evaluation call requested', time: '4 days ago' },
]

/* ------------------------------ revenue chart ---------------------- */

const seed = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface ChartPoint {
  label: string
  value: number
}

function buildSeries(count: number, base: number, variance: number, growth: number): ChartPoint[] {
  const points: ChartPoint[] = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const t = count - 1 - i
    const trend = 1 + (growth * (count - t)) / count
    const jitter = 0.75 + seed(t * 7) * variance
    const d = new Date(today)
    d.setDate(d.getDate() - t)
    points.push({
      label: count > 31 ? monthNames[d.getMonth()] : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round((base * trend * jitter) / 10) * 10,
    })
  }
  return points
}

export const revenueSeries: Record<'7D' | '30D' | '90D' | '1Y', ChartPoint[]> = {
  '7D': buildSeries(7, 1480, 0.35, 0.12),
  '30D': buildSeries(30, 1280, 0.4, 0.16),
  '90D': buildSeries(90, 1050, 0.45, 0.3),
  '1Y': buildSeries(12, 6800, 0.35, 0.55),
}

export const revenueSummary: Record<'7D' | '30D' | '90D' | '1Y', { current: number; previous: number }> = {
  '7D': { current: 9360, previous: 7910 },
  '30D': { current: 38240, previous: 32410 },
  '90D': { current: 98650, previous: 80120 },
  '1Y': { current: 143400, previous: 121050 },
}

/* ------------------------------ helper maps ------------------------ */

export const clientById = new Map(clients.map((c) => [c.id, c]))
export const projectById = new Map(projects.map((p) => [p.id, p]))
export const invoiceById = new Map(invoices.map((i) => [i.id, i]))

export function outstandingInvoices(): Invoice[] {
  return invoices.filter((i) => i.status !== 'Paid')
}

export function activeProjects(): Project[] {
  return projects.filter((p) => p.status !== 'Completed')
}

export function openTasks(): Task[] {
  return tasks.filter((t) => !t.done)
}

export function completedTodayCount(): number {
  return tasks.filter((t) => t.done && t.completedToday).length
}

/* ------------------------------ AI intents ------------------------- */

export interface AiResult {
  intent: string
  title: string
  summary: string
  bullets: string[]
  action?: { label: string; target: 'invoices' | 'clients' | 'projects' | 'tasks' | 'overview' }
}

export function analyze(query: string): AiResult {
  const q = query.toLowerCase()
  const overdue = invoices.filter((i) => i.status === 'Overdue')
  const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0)

  if (q.includes('overdue') || q.includes('attention') || q.includes('invoice')) {
    const oldest = [...overdue].sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))[0]
    const client = oldest ? clientById.get(oldest.clientId)?.company ?? '—' : '—'
    return {
      intent: 'overdue',
      title: 'Invoices needing attention',
      summary: `You have ${overdue.length} overdue invoices totaling ${fmt(overdueTotal)}. The oldest is ${oldest?.id} — ${client} — ${fmt(oldest?.amount ?? 0)} — ${oldest?.daysOverdue} days overdue.`,
      bullets: [
        'Recommended action: send a payment reminder today.',
        'Follow up with a phone call for invoices past 14 days.',
        'INV-1044 (Copper & Pine) is 5 days overdue — a gentle nudge should resolve it.',
      ],
      action: { label: 'View invoices', target: 'invoices' },
    }
  }

  if (q.includes('behind') || q.includes('schedule') || q.includes('project')) {
    const behind = projects.filter((p) => p.status === 'Behind' || p.status === 'At risk')
    return {
      intent: 'projects',
      title: 'Projects off schedule',
      summary: `${behind.length} projects need attention right now. Mobile App (Vertex Labs) is the biggest risk — at 42% with 7 weeks to deadline.`,
      bullets: [
        `${behind.map((p) => `${p.name} (${p.status.toLowerCase()})`).join(' · ')}`,
        'Mobile App: flag scope, propose a revised timeline this week.',
        'SEO & Content and Analytics Platform are watch-listed.',
      ],
      action: { label: 'View projects', target: 'projects' },
    }
  }

  if (q.includes('client') && (q.includes('most') || q.includes('revenue') || q.includes('analyze'))) {
    const top = [...clients].filter((c) => c.status === 'Active').sort((a, b) => b.revenue - a.revenue).slice(0, 3)
    return {
      intent: 'clients',
      title: 'Revenue by client',
      summary: `Acme Studio is your top client at $24,800 in total revenue, followed by Vertex Labs ($18,450) and Atlas Digital ($12,300).`,
      bullets: [
        `Top 3: ${top.map((c) => c.company).join(' · ')}`,
        'Acme Studio accounts for roughly 34% of lifetime revenue — protect this relationship.',
        'Copper & Pine is your fastest-growing account this quarter.',
      ],
      action: { label: 'View clients', target: 'clients' },
    }
  }

  if (q.includes('prioritize') || q.includes('today')) {
    const today = tasks.filter((t) => !t.done && t.due === iso(0))
    const high = tasks.filter((t) => !t.done && t.priority === 'High')
    return {
      intent: 'tasks',
      title: 'Today’s priorities',
      summary: `${today.length} tasks due today, ${high.length} of them high priority. Start with the client-facing blockers.`,
      bullets: [
        ...high.slice(0, 3).map((t) => `${t.title} — ${t.priority} priority`),
        'Set aside 30 focused minutes for the monthly business review.',
        'Recommendation: complete proposal + wireframe review before noon.',
      ],
      action: { label: 'View tasks', target: 'tasks' },
    }
  }

  if (q.includes('performance') || q.includes('performing') || q.includes('month') || q.includes('summary') || q.includes('how is')) {
    const paid = invoices.filter((i) => i.status === 'Paid')
    const paidTotal = paid.reduce((s, i) => s + i.amount, 0)
    return {
      intent: 'overview',
      title: 'Business summary',
      summary: `You've invoiced ${fmt(paidTotal)} this period with a 18.4% month-over-month growth. ${activeProjects().length} projects active, ${openTasks().length} open tasks, and ${overdue.length} invoices overdue.`,
      bullets: [
        `Cash collected: ${fmt(paidTotal)} across ${paid.length} invoices.`,
        `Outstanding: ${fmt(overdueTotal)} across ${overdue.length} overdue invoices.`,
        'Healthy pipeline: 2 new prospects evaluating proposals this month.',
      ],
      action: { label: 'View overview', target: 'overview' },
    }
  }

  return {
    intent: 'general',
    title: 'Analysis',
    summary: `Here's what the data shows across your workspace: ${activeProjects().length} active projects, ${openTasks().length} open tasks, and ${fmt(overdueTotal)} outstanding across ${overdue.length} overdue invoices. Ask me about a client, invoice, or project for more detail.`,
    bullets: [
      'Revenue is trending up 18.4% versus last month.',
      'Top active client by volume: Acme Studio.',
      'Watch item: Mobile App project is behind schedule.',
    ],
    action: { label: 'Open dashboard', target: 'overview' },
  }
}

export const quickPrompts = [
  'How is my business performing this month?',
  'Which invoices are overdue?',
  'Which clients generate the most revenue?',
  'What should I prioritize today?',
  'Show me projects that are behind schedule.',
  'Create an invoice for Acme Studio.',
]

export const quickActions = [
  { id: 'revenue', label: 'Analyze Revenue', prompt: 'How is my revenue trending?' },
  { id: 'overdue', label: 'Find Overdue Invoices', prompt: 'Which invoices are overdue?' },
  { id: 'prioritize', label: 'Prioritize Tasks', prompt: 'What should I prioritize today?' },
  { id: 'clients', label: 'Analyze Clients', prompt: 'Which clients generate the most revenue?' },
  { id: 'summary', label: 'Business Summary', prompt: 'Give me a business summary.' },
]

export const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const fmtExact = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

export function formatDate(isoDate: string) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
