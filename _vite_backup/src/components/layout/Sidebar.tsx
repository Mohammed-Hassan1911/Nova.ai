import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Sparkles,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAppState, type Route } from '@/store/AppState'
import { currentUser } from '@/data/mock'

const nav: { label: string; route: Route; icon: typeof LayoutGrid }[] = [
  { label: 'Overview', route: { view: 'overview' }, icon: LayoutGrid },
  { label: 'Clients', route: { view: 'clients' }, icon: Users },
  { label: 'Projects', route: { view: 'projects' }, icon: FolderKanban },
  { label: 'Tasks', route: { view: 'tasks' }, icon: CheckSquare },
  { label: 'Invoices', route: { view: 'invoices' }, icon: FileText },
  { label: 'AI Assistant', route: { view: 'assistant' }, icon: Sparkles },
]

function isActive(route: Route, target: Route) {
  return route.view === target.view
}

export function Sidebar() {
  const { route, navigate, signOut } = useAppState()

  return (
    <aside className="hidden h-full w-[232px] shrink-0 flex-col border-r border-line bg-canvas-deep/60 md:flex">
      <div className="flex h-14 items-center border-b border-line px-5">
        <Logo size={28} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active = isActive(route, item.route)
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={cn(
                'group relative flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13.5px] transition-colors duration-150',
                active ? 'text-fg' : 'text-fg-3 hover:bg-hover hover:text-fg-2',
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-[8px] bg-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                />
              )}
              <item.icon
                size={16}
                strokeWidth={active ? 2.1 : 1.8}
                className={cn(
                  'relative z-10 transition-colors duration-150',
                  active ? 'text-gold' : 'text-fg-3 group-hover:text-fg-2',
                )}
              />
              <span className="relative z-10">{item.label}</span>
              {active && (
                <span className="absolute right-2 top-1/2 size-1 -translate-y-1/2 rounded-full bg-gold/80" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="space-y-0.5 border-t border-line px-3 py-3">
        <button
          onClick={() => navigate({ view: 'settings' })}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13.5px] transition-colors duration-150',
            route.view === 'settings'
              ? 'text-fg'
              : 'text-fg-3 hover:bg-hover hover:text-fg-2',
          )}
        >
          <Settings
            size={16}
            strokeWidth={1.8}
            className={cn(
              'transition-colors duration-150',
              route.view === 'settings' ? 'text-gold' : 'group-hover:text-fg-2',
            )}
          />
          Settings
        </button>

        <div className="mt-2 rounded-[10px] border border-line bg-surface p-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={currentUser.initials} size={34} status="online" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">
                {currentUser.name}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-fg-3">
                <span className="rounded-[4px] border border-gold/30 bg-gold/[0.08] px-1 py-[1px] text-[9.5px] font-semibold uppercase tracking-wide text-gold">
                  Pro
                </span>
                {currentUser.company}
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-md p-1.5 text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
