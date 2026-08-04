'use client'

import { useState } from 'react'
import { Coffee, Shield, User as UserIcon, LogIn } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiGet } from '@/lib/api'
import { toast } from 'sonner'
import type { AuthUser } from '@/lib/types'

export function LoginView() {
  const setUser = useAppStore((s) => s.setUser)
  const [loading, setLoading] = useState<'admin' | 'employee' | null>(null)

  async function loginAdmin() {
    setLoading('admin')
    try {
      const r = await apiGet<{ ok: true; user: AuthUser }>('/api/auth/login-admin')
      setUser(r.user)
      toast.success(`Bienvenido, ${r.user.name}`)
    } catch {
      toast.error('No se pudo iniciar sesión como administrador')
    } finally {
      setLoading(null)
    }
  }

  async function loginEmployee() {
    setLoading('employee')
    try {
      const r = await apiGet<{ ok: true; user: AuthUser }>('/api/auth/login-employee')
      setUser(r.user)
      toast.success(`Bienvenido, ${r.user.name}`)
    } catch {
      toast.error('No se pudo iniciar sesión como empleado')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-sage-gradient">
      <div className="w-full max-w-md">
        {/* Logo block */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-sm mb-5">
            <Coffee className="w-8 h-8 text-sage" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            La Cafeta
          </h1>
          <p className="font-serif text-muted-foreground mt-1 text-base">
            Cantina · Punto de venta
          </p>
        </div>

        {/* Card */}
        <div className="card-wellness p-6 sm:p-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Selecciona cómo quieres entrar a la aplicación.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={loginAdmin}
              disabled={loading !== null}
              className="btn-sage w-full justify-center py-3 text-base disabled:opacity-60"
              aria-label="Entrar como Administrador"
            >
              {loading === 'admin' ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              Entrar como Administrador
            </button>

            <button
              onClick={loginEmployee}
              disabled={loading !== null}
              className="btn-outline w-full justify-center py-3 text-base disabled:opacity-60"
              aria-label="Entrar como Empleado"
            >
              {loading === 'employee' ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
              Entrar como Empleado
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <LogIn className="w-3.5 h-3.5" />
            Acceso demo — sin contraseña
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 tracking-wide">
          Wellness · ClearPath
        </p>
      </div>
    </main>
  )
}
