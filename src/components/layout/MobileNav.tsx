'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Users, FolderKanban, CheckSquare, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Home', href: '/dashboard', icon: LayoutGrid },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'AI', href: '/assistant', icon: Sparkles },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="border-t border-line-strong bg-canvas/95 px-1.5 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          {items.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
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
                <item.icon size={19} strokeWidth={active ? 2.2 : 1.8} className="relative" />
                <span className="relative text-[9.5px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
