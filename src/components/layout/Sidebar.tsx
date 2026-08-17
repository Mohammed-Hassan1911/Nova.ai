'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
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
import { initialsOf } from '@/lib/utils'
import { EASE_OUT } from '@/components/motion/variants'

const navGroups: { label: string; items: { label: string; href: string; icon: typeof LayoutGrid }[] }[] = [
  {
    label: 'Main',
    items: [{ label: 'Overview', href: '/dashboard', icon: LayoutGrid }],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Clients', href: '/clients', icon: Users },
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare },
      { label: 'Invoices', href: '/invoices', icon: FileText },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar({
  userName,
  userEmail,
  workspaceName,
}: {
  userName: string | null
  userEmail: string
  workspaceName: string
}) {
  const pathname = usePathname()

  return (
    <aside className="hidden h-full w-[264px] shrink-0 flex-col border-r border-line bg-canvas-deep/55 backdrop-blur-xl md:flex">
      <div className="pointer-events-none absolute left-0 top-0 h-40 w-full overflow-hidden">
        <div className="absolute -top-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-violet/[0.09] blur-3xl" />
      </div>

      <div className="relative flex h-16 shrink-0 items-center border-b border-line px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo size={30} compact />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-[0.2em] text-fg">VANTA</span>
            <span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.18em] text-fg-3">
              Command center
            </span>
          </div>
        </Link>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-3 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-fg-3">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-all duration-[220ms] ease-out active:scale-[0.98]',
                      active ? 'text-fg' : 'text-fg-3 hover:bg-hover hover:text-fg-2',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
                        className="absolute inset-0 rounded-[10px] border border-violet/25 bg-gradient-to-r from-violet/[0.14] to-violet/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(139,92,246,0.4)]"
                      />
                    )}
                    <item.icon
                      size={17}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={cn(
                        'relative z-10 shrink-0 transition-[color,transform] duration-[220ms] ease-out group-hover:translate-x-[2px]',
                        active ? 'text-violet-bright' : 'text-fg-3 group-hover:text-fg-2',
                      )}
                    />
                    <span className="relative z-10 truncate">{item.label}</span>
                    {active && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.25, ease: EASE_OUT }}
                        className="relative z-10 ml-auto size-1.5 rounded-full bg-violet-bright shadow-[0_0_8px_rgba(139,92,246,0.9)]"
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-line p-3">
        <div className="glass rounded-[14px] p-3">
          <div className="flex items-center gap-3">
            <Avatar initials={initialsOf(userName)} size={36} status="online" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{userName ?? userEmail}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-fg-3">
                <span className="rounded-[5px] border border-violet/30 bg-violet/[0.1] px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-wide text-violet-bright">
                  Pro
                </span>
                <span className="truncate">{workspaceName}</span>
              </p>
            </div>
            <button
              onClick={() => signOut({ redirect: false }).then(() => { window.location.href = '/login' })}
              className="rounded-lg p-1.5 text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-danger"
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
