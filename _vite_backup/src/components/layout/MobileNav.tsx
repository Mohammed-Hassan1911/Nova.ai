import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppState, type Route } from '@/store/AppState'

const items: { label: string; route: Route; icon: typeof LayoutGrid }[] = [
  { label: 'Home', route: { view: 'overview' }, icon: LayoutGrid },
  { label: 'Clients', route: { view: 'clients' }, icon: Users },
  { label: 'Projects', route: { view: 'projects' }, icon: FolderKanban },
  { label: 'Tasks', route: { view: 'tasks' }, icon: CheckSquare },
  { label: 'Invoices', route: { view: 'invoices' }, icon: FileText },
  { label: 'AI', route: { view: 'assistant' }, icon: Sparkles },
]

export function MobileNav() {
  const { route, navigate } = useAppState()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="border-t border-line-strong bg-canvas/95 px-1.5 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          {items.map((item) => {
            const active = route.view === item.route.view
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className={cn(
                  'relative flex w-[16.6%] flex-col items-center gap-0.5 rounded-[10px] py-1.5 transition-colors duration-150',
                  active ? 'text-gold' : 'text-fg-3 hover:text-fg-2',
                )}
                aria-label={item.label}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-[10px] bg-gold/[0.07]"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                  />
                )}
                <item.icon
                  size={19}
                  strokeWidth={active ? 2.2 : 1.8}
                  className="relative"
                />
                <span className="relative text-[9.5px] font-medium">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
