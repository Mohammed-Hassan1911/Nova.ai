import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { MotionConfig } from 'framer-motion'
import '@/app/globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { Cursor } from '@/components/ui/Cursor'
import { SessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'VANTA — AI business operating system',
    template: '%s · VANTA',
  },
  description: 'Clients, projects, tasks, invoices and an AI assistant — in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>
          <MotionConfig reducedMotion="user">
            <ToastProvider>{children}</ToastProvider>
            <Cursor />
          </MotionConfig>
        </SessionProvider>
      </body>
    </html>
  )
}
