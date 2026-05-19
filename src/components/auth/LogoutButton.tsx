import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { signOutEverywhere } from '../../services/auth.service'
import { cn } from '../../lib/cn'

type LogoutButtonProps = {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOutEverywhere()
    navigate('/login', { replace: true })
  }

  return (
    <motion.button
      type="button"
      onClick={() => void handleLogout()}
      className={cn(
        'w-full border-[3px] border-nje-border bg-nje-bg px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-[transform,box-shadow] duration-150',
        'hover:shadow-[var(--shadow-nje-flat)] motion-safe:active:translate-y-px sm:w-auto',
        className,
      )}
      whileTap={{ scale: 0.99 }}
    >
      Sign out
    </motion.button>
  )
}
