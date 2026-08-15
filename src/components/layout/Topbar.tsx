'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Bell, ChevronDown, LogOut, Settings } from 'lucide-react'
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
  TASK_DUE: 'bg-gold/15 text-gold',
  PROJECT_DEADLINE: 'bg-gold/15 text-gold',
  CLIENT_CREATED: 'bg-info/15 text-info',
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

export function Topbar({ userName, userEmail }: { userName: string | null; userEmail: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)

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
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-1.5 text-[12.5px] text-fg-2">
          <span className="text-[11px] text-fg-3">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Dropdown
          width={340}
          trigger={
            <button
              className="relative flex size-9 items-center justify-center rounded-[8px] border border-line bg-surface text-fg-2 transition-colors duration-150 hover:border-line-strong hover:text-fg"
              aria-label="Notifications"
            >
              <Bell size={15} strokeWidth={1.9} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full border-2 border-canvas bg-gold text-[9px] font-bold text-[#16130b]">
                  {unread > 9 ? '9+' : unread}
                </span>
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
                  className="text-[12px] text-gold transition-colors hover:text-gold-bright"
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
                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-semibold',
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
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
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
              className="rounded-[8px] p-1 transition-all duration-150 hover:bg-hover"
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
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
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
