'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
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

const nav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutGrid },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
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
    <aside className="hidden h-full w-[232px] shrink-0 flex-col border-r border-line bg-canvas-deep/60 md:flex">
      <div className="flex h-14 items-center border-b border-line px-5">
        <Link href="/dashboard">
          <Logo size={28} />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
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
            </Link>
          )
        })}
      </nav>

      <div className="space-y-0.5 border-t border-line px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13.5px] transition-colors duration-150',
            pathname.startsWith('/settings')
              ? 'text-fg'
              : 'text-fg-3 hover:bg-hover hover:text-fg-2',
          )}
        >
          <Settings
            size={16}
            strokeWidth={1.8}
            className={cn(
              'transition-colors duration-150',
              pathname.startsWith('/settings') ? 'text-gold' : 'group-hover:text-fg-2',
            )}
          />
          Settings
        </Link>

        <div className="mt-2 rounded-[10px] border border-line bg-surface p-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={initialsOf(userName)} size={34} status="online" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">
                {userName ?? userEmail}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-fg-3">
                <span className="rounded-[4px] border border-gold/30 bg-gold/[0.08] px-1 py-[1px] text-[9.5px] font-semibold uppercase tracking-wide text-gold">
                  Pro
                </span>
                {workspaceName}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
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
