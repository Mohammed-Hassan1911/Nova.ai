'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { Bell, LogOut, Settings, Command } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components/ui/Dropdown'
import { Avatar } from '@/components/ui/Avatar'
import { initialsOf, timeAgo } from '@/lib/utils'
import { api } from '@/lib/client'
import type { NotificationItem } from '@/lib/types'

const notificationStyles: Record<string, string> = {
  INVOICE_PAID: 'bg-emerald/15 text-emerald',
  PAYMENT_RECEIVED: 'bg-emerald/15 text-emerald',
  INVOICE_OVERDUE: 'bg-danger/15 text-danger',
  TASK_DUE: 'bg-violet/15 text-violet-bright',
  PROJECT_DEADLINE: 'bg-violet/15 text-violet-bright',
  CLIENT_CREATED: 'bg-cyan/15 text-cyan',
  SYSTEM: 'bg-white/8 text-fg-2',
}

const notificationIcon: Record<string, string> = {
  INVOICE_PAID: '$',
  PAYMENT_RECEIVED: '$',
  INVOICE_OVERDUE: '!',
  TASK_DUE: '◎',
  PROJECT_DEADLINE: '◎',
  CLIENT_CREATED: '+',
  SYSTEM: '·',
}

const sectionLabels: [string, string][] = [
  ['/dashboard', 'Overview'],
  ['/clients', 'Clients'],
  ['/projects', 'Projects'],
  ['/tasks', 'Tasks'],
  ['/invoices', 'Invoices'],
  ['/assistant', 'AI Assistant'],
  ['/settings', 'Settings'],
]

export function Topbar({
  userName,
  userEmail,
  scrolled = false,
}: {
  userName: string | null
  userEmail: string
  scrolled?: boolean
}) {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)

  const section = sectionLabels.find(([p]) => pathname.startsWith(p))?.[1] ?? 'Workspace'

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ notifications: NotificationItem[]; unread: number }>(
        '/api/notifications?per_page=20',
      )
      setNotifications(data.notifications)
      setUnread(data.unread)
    } catch {
      // silently ignore; the badge just stays empty
    }
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 60_000)
    return () => window.clearInterval(interval)
  }, [load])

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
      setUnread(0)
    } catch {
      // ignore
    }
  }

  return (
    <header
      className={cn(
        'relative z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-canvas/85 px-5 backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-[300ms] ease-out sm:px-8',
        scrolled
          ? 'border-line-strong bg-canvas/92 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)]'
          : 'border-line',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-1.5 shrink-0 rounded-full bg-violet-bright shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        <span className="truncate text-[13.5px] font-medium text-fg-2">{section}</span>
        <span className="hidden text-[12px] text-fg-3 sm:block">
          · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-1.5 text-[12.5px] text-fg-3 md:flex">
          <Command size={12} className="text-fg-3" />
          <span>Search</span>
        </div>

        <Dropdown
          width={340}
          trigger={
            <button
              className="group relative flex size-9 items-center justify-center rounded-[10px] border border-line bg-surface text-fg-2 transition-all duration-[220ms] ease-out hover:border-line-strong hover:text-fg active:scale-95"
              aria-label="Notifications"
            >
              <motion.span
                key={unread}
                animate={unread > 0 ? { rotate: [0, -14, 10, -6, 0] } : undefined}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="inline-flex transition-transform duration-[220ms] ease-out group-hover:-rotate-6 group-hover:scale-110"
              >
                <Bell size={15} strokeWidth={1.9} />
              </motion.span>
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.6 }}
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-canvas bg-violet text-[9px] font-bold text-white"
                >
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </button>
          }
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-[13px] font-semibold text-fg">Notifications</p>
                <button
                  onClick={markAllRead}
                  className="text-[12px] text-violet-bright transition-colors hover:text-violet"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-1.5">
                {notifications.length === 0 && (
                  <p className="px-2.5 py-6 text-center text-[12.5px] text-fg-3">
                    You're all caught up.
                  </p>
                )}
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? '/dashboard'}
                    onClick={close}
                    className="flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-hover"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold',
                        notificationStyles[n.kind] ?? 'bg-white/8 text-fg-2',
                      )}
                    >
                      {notificationIcon[n.kind] ?? '·'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-tight text-fg">
                        {n.title}
                      </span>
                      {n.detail && (
                        <span className="mt-0.5 block text-[12px] leading-snug text-fg-3">
                          {n.detail}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-fg-3">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.readAt && (
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-violet" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Dropdown>

        <Dropdown
          width={240}
          trigger={
            <button
              className="rounded-full p-0.5 transition-all duration-[220ms] ease-out ring-1 ring-transparent hover:ring-violet/50 active:scale-95"
              aria-label="Account menu"
            >
              <Avatar initials={initialsOf(userName)} size={30} />
            </button>
          }
        >
          {(close) => (
            <div className="p-1.5">
              <div className="border-b border-line px-2.5 pb-3 pt-2">
                <p className="text-[13px] font-semibold text-fg">{userName ?? userEmail}</p>
                <p className="truncate text-[12px] text-fg-3">{userEmail}</p>
              </div>
              <div className="py-1.5">
                <Link
                  href="/settings"
                  onClick={close}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-[220ms] ease-out hover:bg-hover hover:text-fg"
                >
                  <Settings size={15} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    close()
                    signOut({ callbackUrl: '/login' })
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-danger transition-colors duration-150 hover:bg-danger/10"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  )
}
