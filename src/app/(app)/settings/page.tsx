'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { Shield, Sparkles, User, LogOut, Building2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { initialsOf } from '@/lib/utils'

interface SessionUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

export default function SettingsPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setUser(data?.user ?? null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg lg:text-[30px]">Settings</h1>
      <p className="mt-1 text-[13.5px] text-fg-3">
        Manage your profile, workspace, and account.
      </p>

      <Section icon={<User size={15} />} title="Profile">
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-[52px] rounded-[12px]" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar initials={initialsOf(user?.name ?? user?.email ?? '?')} size={52} />
            <div>
              <p className="text-[14px] font-medium text-fg">{user?.name ?? 'Your account'}</p>
              <p className="text-[12.5px] text-fg-3">{user?.email ?? 'Signed in with NOVA'}</p>
            </div>
          </div>
        )}
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[13px] leading-relaxed text-fg-2">
            Your name and email come from your NOVA account. To change them, sign out and manage your credentials at the sign-in provider.
          </p>
        </div>
      </Section>

      <Section icon={<Building2 size={15} />} title="Workspace">
        <p className="text-[13px] leading-relaxed text-fg-2">
          All clients, projects, tasks, invoices, and AI conversations belong to your workspace and are fully isolated from other accounts.
        </p>
        <div className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-fg-3">
          Workspace data is managed from the app — clients, projects, and invoices are organized on their own pages.
        </div>
      </Section>

      <Section icon={<Shield size={15} />} title="Security">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-medium text-fg">Sign out</p>
            <p className="text-[12.5px] text-fg-3">You can sign back in at any time.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </Section>

      <div className="flex items-center justify-center gap-2 pb-4 text-[12px] text-fg-3">
        <Sparkles size={12} className="text-gold" />
        NOVA v1.0 · Made for solo operators and small studios.
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-7 rounded-[var(--radius-panel)] border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <span className="text-fg-3">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-fg">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}
