import { AnimatePresence, motion } from 'framer-motion'
import { AppStateProvider, useAppState } from '@/store/AppState'
import { ToastProvider } from '@/components/ui/Toast'
import { Login } from '@/pages/Login'
import { AppShell } from '@/components/layout/AppShell'

function Root() {
  const { isAuthenticated } = useAppState()
  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-screen"
        >
          <AppShell />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Login />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </AppStateProvider>
  )
}
