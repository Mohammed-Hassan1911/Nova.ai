'use client'

import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { NovaMark } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { initialsOf } from '@/lib/utils'

export function AppShell({
  userName,
  userEmail,
  workspaceName,
  children,
}: {
  userName: string | null
  userEmail: string
  workspaceName: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar userName={userName} userEmail={userEmail} workspaceName={workspaceName} />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar userName={userName} userEmail={userEmail} />

        <div className="relative flex-1 overflow-y-auto">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.16]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold/[0.025] to-transparent" />

          <div className="relative z-20 flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
            <a href="/dashboard" className="flex items-center gap-2">
              <NovaMark size={24} />
              <span className="text-[14px] font-semibold tracking-[0.12em] text-fg">
                NOVA
              </span>
            </a>
            <Avatar initials={initialsOf(userName)} size={26} />
          </div>

          <motion.div
            key="page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[1120px] px-5 py-7 pb-28 sm:px-8 md:pb-12 lg:px-10"
          >
            {children}
          </motion.div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
