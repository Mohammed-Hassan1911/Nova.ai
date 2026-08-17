'use client'

import { useEffect, useRef, useState } from 'react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AnimatedBackground } from '@/components/background/AnimatedBackground'
import { BrandMark } from '@/components/ui/Logo'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 8)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <AnimatedBackground variant="app" />
      <Sidebar userName={userName} userEmail={userEmail} workspaceName={workspaceName} />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar userName={userName} userEmail={userEmail} scrolled={scrolled} />

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-violet/[0.03] to-transparent" />

          <div className="relative z-20 flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
            <a href="/dashboard" className="flex items-center gap-2">
              <BrandMark size={24} />
              <span className="text-[14px] font-semibold tracking-[0.16em] text-fg">
                VANTA
              </span>
            </a>
            <Avatar initials={initialsOf(userName)} size={26} />
          </div>

          <PageTransition>
            <div className="relative mx-auto w-full max-w-[1120px] px-5 py-7 pb-28 sm:px-8 md:pb-12 lg:px-10">
              {children}
            </div>
          </PageTransition>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
