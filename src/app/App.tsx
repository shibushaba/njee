import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { AuthProvider } from '../providers/AuthProvider'
import { PwaShell } from '../components/pwa/PwaShell'
import { SplashScreen } from '../components/splash/SplashScreen'
import { AppRoutes } from './routes'

export function App() {
  const [splash, setSplash] = useState(true)

  const handleSplashFinish = useCallback(() => {
    setSplash(false)
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          {!splash ? <PwaShell /> : null}
          <AnimatePresence mode="wait">
            {splash ? (
              <SplashScreen key="splash" onFinish={handleSplashFinish} />
            ) : (
              <motion.div
                key="app-shell"
                className="flex min-h-dvh flex-1 flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <AppRoutes />
              </motion.div>
            )}
          </AnimatePresence>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  )
}
