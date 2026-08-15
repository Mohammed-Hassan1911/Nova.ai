import { CalendarDays, Bell, ChevronDown, LogOut, Settings, CreditCard, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components/ui/Dropdown'
import { Avatar } from '@/components/ui/Avatar'
import { useAppState } from '@/store/AppState'
import { notifications, currentUser } from '@/data/mock'

const notificationStyles: Record<string, string> = {
  payment: 'bg-emerald/15 text-emerald',
  overdue: 'bg-danger/15 text-danger',
  project: 'bg-gold/15 text-gold',
  client: 'bg-info/15 text-info',
}

const notificationIcon: Record<string, string> = {
  payment: '$',
  overdue: '!',
  project: '◎',
  client: '+',
}

export function Topbar() {
  const { navigate, signOut } = useAppState()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Dropdown
          align="left"
          width={220}
          trigger={
            <button className="flex items-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-1.5 text-[12.5px] text-fg-2 transition-colors duration-150 hover:border-line-strong hover:text-fg">
              <CalendarDays size={14} className="text-fg-3" />
              <span className="tabular">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <ChevronDown size={12} className="text-fg-3" />
            </button>
          }
        >
          {() => (
            <div className="p-2">
              <p className="px-2 py-1 text-[12px] font-medium text-fg-2">
                Select a view
              </p>
              {[
                { label: 'Today', note: new Date().toLocaleDateString('en-US', { weekday: 'long' }) },
                { label: 'This week', note: 'Mon — Sun' },
                { label: 'This month', note: 'Full month' },
              ].map((o) => (
                <button
                  key={o.label}
                  className="flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-[13px] text-fg transition-colors duration-150 hover:bg-hover"
                >
                  {o.label}
                  <span className="text-[11px] text-fg-3">{o.note}</span>
                </button>
              ))}
            </div>
          )}
        </Dropdown>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <Dropdown
          width={340}
          trigger={
            <button
              className="relative flex size-9 items-center justify-center rounded-[8px] border border-line bg-surface text-fg-2 transition-colors duration-150 hover:border-line-strong hover:text-fg"
              aria-label="Notifications"
            >
              <Bell size={15} strokeWidth={1.9} />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full border-2 border-canvas bg-gold text-[9px] font-bold text-[#16130b]">
                {notifications.length}
              </span>
            </button>
          }
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-[13px] font-semibold text-fg">Notifications</p>
                <button className="text-[12px] text-gold transition-colors hover:text-gold-bright">
                  Mark all read
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-1.5">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.kind === 'overdue') navigate({ view: 'invoices' })
                      if (n.kind === 'project') navigate({ view: 'projects' })
                      close()
                    }}
                    className="flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-hover"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-semibold',
                        notificationStyles[n.kind],
                      )}
                    >
                      {notificationIcon[n.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-tight text-fg">
                        {n.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-fg-3">
                        {n.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-fg-3">{n.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Dropdown>

        {/* Profile */}
        <Dropdown
          width={240}
          trigger={
            <button
              className="rounded-[8px] p-1 transition-all duration-150 hover:bg-hover"
              aria-label="Account menu"
            >
              <Avatar initials={currentUser.initials} size={30} />
            </button>
          }
        >
          {(close) => (
            <div className="p-1.5">
              <div className="border-b border-line px-2.5 pb-3 pt-2">
                <p className="text-[13px] font-semibold text-fg">{currentUser.name}</p>
                <p className="truncate text-[12px] text-fg-3">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.07] px-2 py-0.5 text-[11px] font-medium text-gold">
                  <CreditCard size={11} />
                  {currentUser.plan} plan
                </div>
              </div>
              <div className="py-1.5">
                <button
                  onClick={() => {
                    navigate({ view: 'settings' })
                    close()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
                >
                  <Settings size={15} />
                  Settings
                </button>
                <button
                  onClick={() => {
                    navigate({ view: 'overview' })
                    close()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg"
                >
                  <ArrowUpRight size={15} />
                  View public workspace
                </button>
                <button
                  onClick={() => {
                    signOut()
                    close()
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
