'use client'

import { ArrowLeft, Coffee, LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAppStore } from '@/lib/store'
import { apiGet } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  title?: string
  onBack?: () => void
}

export function AppHeader({ title, onBack }: Props) {
  const logout = useAppStore((s) => s.logout)
  const router = useRouter()

  async function handleLogout() {
    try {
      await apiGet('/api/auth/logout')
    } catch {
      // ignore network errors
    }
    logout()
    toast.success('Sesión cerrada')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="btn-ghost p-2 shrink-0" aria-label="Volver">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <Coffee className="w-5 h-5 text-sage shrink-0" />
            <span className="font-semibold tracking-tight shrink-0">La Cafeta</span>
            {title && (
              <span className="text-muted-foreground text-sm truncate">
                / {title}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button onClick={handleLogout} className="btn-outline text-sm hidden sm:inline-flex">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
          <button onClick={handleLogout} className="btn-outline p-2 sm:hidden" aria-label="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
