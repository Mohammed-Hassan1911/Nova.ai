import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { NovaMark } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAppState } from '@/store/AppState'
import { currentUser } from '@/data/mock'
import { Dashboard } from '@/pages/Dashboard'
import { Clients } from '@/pages/Clients'
import { ClientProfile } from '@/pages/ClientProfile'
import { Projects } from '@/pages/Projects'
import { Tasks } from '@/pages/Tasks'
import { Invoices } from '@/pages/Invoices'
import { InvoiceDetail } from '@/pages/InvoiceDetail'
import { Assistant } from '@/pages/Assistant'
import { SettingsPage } from '@/pages/SettingsPage'

function RouteView({ route }: { route: ReturnType<typeof useAppState>['route'] }) {
  switch (route.view) {
    case 'overview':
      return <Dashboard />
    case 'clients':
      return <Clients />
    case 'client':
      return <ClientProfile clientId={route.id} />
    case 'projects':
      return <Projects />
    case 'tasks':
      return <Tasks />
    case 'invoices':
      return <Invoices />
    case 'invoice':
      return <InvoiceDetail invoiceId={route.id} />
    case 'assistant':
      return <Assistant />
    case 'settings':
      return <SettingsPage />
  }
}

export function AppShell() {
  const { route, navigate } = useAppState()

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />

        <div className="relative flex-1 overflow-y-auto">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.16]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold/[0.025] to-transparent" />

          {/* mobile brand bar */}
          <div className="relative z-20 flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
            <button
              onClick={() => navigate({ view: 'overview' })}
              className="flex items-center gap-2"
            >
              <NovaMark size={24} />
              <span className="text-[14px] font-semibold tracking-[0.12em] text-fg">
                NOVA
              </span>
            </button>
            <Avatar initials={currentUser.initials} size={26} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={route.view + (route.view === 'client' || route.view === 'invoice' ? route.id : '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[1120px] px-5 py-7 pb-28 sm:px-8 md:pb-12 lg:px-10"
            >
              <RouteView route={route} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
