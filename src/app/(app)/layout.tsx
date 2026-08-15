import { redirect } from 'next/navigation'
import { getWorkspaceContext, getSessionUser } from '@/lib/workspace'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getWorkspaceContext()
  if (!ctx) {
    const user = await getSessionUser()
    redirect(user ? '/onboarding' : '/login')
  }

  return (
    <AppShell
      userName={ctx.user.name}
      userEmail={ctx.user.email}
      workspaceName={ctx.workspace.name}
    >
      {children}
    </AppShell>
  )
}
