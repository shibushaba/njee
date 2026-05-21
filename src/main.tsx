import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const el = document.getElementById('root')
if (!el) {
  throw new Error('Root element #root not found')
}

function hasSupabaseEnv(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return typeof url === 'string' && url.length > 0 && typeof key === 'string' && key.length > 0
}

void (async () => {
  if (!hasSupabaseEnv()) {
    const { MissingEnvScreen } = await import('./MissingEnvScreen')
    createRoot(el).render(
      <StrictMode>
        <MissingEnvScreen />
      </StrictMode>,
    )
    return
  }
  const { App } = await import('./app/App')
  const { initPwaRegistration } = await import('./pwa/registerPwa')
  initPwaRegistration()
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})()
