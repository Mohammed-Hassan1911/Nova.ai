import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clients as seedClients,
  projects as seedProjects,
  tasks as seedTasks,
  invoices as seedInvoices,
  currentUser,
  type Client,
  type Project,
  type Task,
  type Invoice,
  type ClientStatus,
} from '@/data/mock'

export type Route =
  | { view: 'overview' }
  | { view: 'clients' }
  | { view: 'client'; id: string }
  | { view: 'projects' }
  | { view: 'tasks' }
  | { view: 'invoices' }
  | { view: 'invoice'; id: string }
  | { view: 'assistant' }
  | { view: 'settings' }

interface AppStateValue {
  isAuthenticated: boolean
  user: typeof currentUser
  route: Route
  clients: Client[]
  projects: Project[]
  tasks: Task[]
  invoices: Invoice[]
  clientById: (id: string) => Client | undefined
  projectById: (id: string) => Project | undefined
  invoiceById: (id: string) => Invoice | undefined
  signIn: () => void
  signOut: () => void
  navigate: (route: Route) => void
  addClient: (c: Omit<Client, 'id' | 'initials' | 'revenue' | 'since' | 'lastActivity' | 'notes'> & { notes?: string }) => void
  updateClientStatus: (id: string, status: ClientStatus) => void
  addProject: (p: Omit<Project, 'id' | 'spent' | 'progress' | 'status' | 'description'> & { status?: Project['status']; description?: string }) => void
  addTask: (t: Omit<Task, 'id' | 'done' | 'completedToday'>) => void
  toggleTask: (id: string) => void
  createInvoice: (i: Omit<Invoice, 'id' | 'status' | 'daysOverdue' | 'amount' | 'note' | 'items'> & { items?: Invoice['items']; note?: string }) => string
  markInvoicePaid: (id: string) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

let idCounter = 100

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [route, setRoute] = useState<Route>({ view: 'overview' })
  const [clients, setClients] = useState<Client[]>(seedClients)
  const [projects, setProjects] = useState<Project[]>(seedProjects)
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices)

  const signIn = useCallback(() => setIsAuthenticated(true), [])
  const signOut = useCallback(() => {
    setIsAuthenticated(false)
    setRoute({ view: 'overview' })
  }, [])

  const navigate = useCallback((r: Route) => {
    setRoute(r)
    window.scrollTo({ top: 0 })
  }, [])

  const addClient: AppStateValue['addClient'] = useCallback((c) => {
    const id = `c${++idCounter}`
    const companyParts = c.company.trim().split(/\s+/)
    const initials =
      companyParts.length > 1
        ? companyParts[0][0] + companyParts[companyParts.length - 1][0]
        : companyParts[0]?.slice(0, 2).toUpperCase() ?? 'NA'
    setClients((prev) => [
      {
        id,
        name: c.name,
        company: c.company,
        initials: initials.toUpperCase(),
        email: c.email,
        phone: c.phone,
        status: c.status,
        revenue: 0,
        since: 'Aug 2026',
        lastActivity: 'just now',
        notes: c.notes ?? '',
      },
      ...prev,
    ])
  }, [])

  const updateClientStatus = useCallback((id: string, status: ClientStatus) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }, [])

  const addProject: AppStateValue['addProject'] = useCallback((p) => {
    setProjects((prev) => [
      {
        id: `p${++idCounter}`,
        name: p.name,
        clientId: p.clientId,
        progress: 0,
        deadline: p.deadline,
        budget: p.budget,
        spent: 0,
        status: p.status ?? 'On track',
        description: p.description ?? 'New project kickoff.',
      },
      ...prev,
    ])
  }, [])

  const addTask: AppStateValue['addTask'] = useCallback((t) => {
    setTasks((prev) => [
      { id: `t${++idCounter}`, ...t, done: false, completedToday: false },
      ...prev,
    ])
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedToday: !t.done } : t,
      ),
    )
  }, [])

  const createInvoice: AppStateValue['createInvoice'] = useCallback((i) => {
    const id = `INV-${1048 + Math.floor(Math.random() * 40)}`
    const amount = (i.items ?? []).reduce((s, l) => s + l.quantity * l.rate, 0)
    setInvoices((prev) => [
      {
        id,
        clientId: i.clientId,
        amount,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        status: 'Pending',
        items: i.items ?? [],
        note: i.note ?? '',
      },
      ...prev,
    ])
    return id
  }, [])

  const markInvoicePaid = useCallback((id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'Paid' } : inv)),
    )
  }, [])

  const clientById = useCallback((id: string) => clients.find((c) => c.id === id), [clients])
  const projectById = useCallback((id: string) => projects.find((p) => p.id === id), [projects])
  const invoiceById = useCallback((id: string) => invoices.find((i) => i.id === id), [invoices])

  const value = useMemo<AppStateValue>(
    () => ({
      isAuthenticated,
      user: currentUser,
      route,
      clients,
      projects,
      tasks,
      invoices,
      clientById,
      projectById,
      invoiceById,
      signIn,
      signOut,
      navigate,
      addClient,
      updateClientStatus,
      addProject,
      addTask,
      toggleTask,
      createInvoice,
      markInvoicePaid,
    }),
    [
      isAuthenticated,
      route,
      clients,
      projects,
      tasks,
      invoices,
      clientById,
      projectById,
      invoiceById,
      signIn,
      signOut,
      navigate,
      addClient,
      updateClientStatus,
      addProject,
      addTask,
      toggleTask,
      createInvoice,
      markInvoicePaid,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
