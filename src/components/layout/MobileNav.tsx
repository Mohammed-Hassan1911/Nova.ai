'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu,
  X,
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
import { BrandMark } from '@/components/ui/Logo'
import { EASE_OUT } from '@/components/motion/variants'

const items = [
  { label: 'Overview', href: '/dashboard', icon: LayoutGrid },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="glass-strong fixed bottom-6 left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full text-fg transition-transform duration-[220ms] ease-out active:scale-90 md:hidden"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="fixed inset-0 z-50 flex flex-col bg-canvas/72 backdrop-blur-2xl md:hidden"
            style={{
              background:
                'linear-gradient(160deg, rgba(124,58,237,0.08), rgba(5,5,5,0.72) 45%), rgba(5,5,5,0.72)',
            }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <div className="flex items-center gap-2.5">
                <BrandMark size={28} />
                <span className="text-[16px] font-semibold tracking-[0.2em] text-fg">VANTA</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-fg-2 transition-all duration-[220ms] ease-out active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
              <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-3">
                Workspace
              </p>
              <div className="space-y-1.5">
                {items.map((item, i) => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ delay: 0.05 + i * 0.045, duration: 0.4, ease: EASE_OUT }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 text-[15px] font-medium transition-all duration-[220ms] ease-out active:scale-[0.98]',
                          active
                            ? 'border-violet/30 bg-violet/[0.1] text-fg shadow-[0_8px_28px_-12px_rgba(139,92,246,0.5)]'
                            : 'border-line/60 bg-surface text-fg-2',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-9 items-center justify-center rounded-[10px] border',
                            active
                              ? 'border-violet/40 bg-violet/[0.14] text-violet-bright'
                              : 'border-line text-fg-3',
                          )}
                        >
                          <item.icon size={17} />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <span className="size-1.5 rounded-full bg-violet-bright shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.05 + items.length * 0.045, duration: 0.4, ease: EASE_OUT }}
                className="mt-8"
              >
                <button
                  onClick={() => signOut({ redirect: false }).then(() => { window.location.href = '/login' })}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-danger/25 bg-danger/[0.06] px-4 py-3.5 text-[14px] font-medium text-danger transition-all duration-[220ms] ease-out active:scale-[0.98]"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
