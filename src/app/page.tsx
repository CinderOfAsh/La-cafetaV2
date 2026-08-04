'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { apiGet } from '@/lib/api'
import { LoginView } from '@/views/LoginView'
import { HubAdminView } from '@/views/HubAdminView'
import { HubEmpleadoView } from '@/views/HubEmpleadoView'
import { ProductosView } from '@/views/admin/ProductosView'
import { PersonalView } from '@/views/admin/PersonalView'
import { AsignarTurnosView } from '@/views/admin/AsignarTurnosView'
import { ProtocolosView } from '@/views/admin/ProtocolosView'
import { DashboardView } from '@/views/admin/DashboardView'
import { EmployeesView } from '@/views/admin/EmployeesView'
import { SandboxView } from '@/views/admin/SandboxView'
import { TurnoView } from '@/views/turno/TurnoView'
import { CalendarioView } from '@/views/turno/CalendarioView'
import { DashboardEmpleadoView } from '@/views/turno/DashboardEmpleadoView'
import { LoadingBlock } from '@/components/ui-bits'
import type { AuthUser } from '@/lib/types'

export default function Home() {
  const { user, view, setUser, setView, setHydrated, hydrated } = useAppStore()
  const [booting, setBooting] = useState(true)

  // On mount, hydrate auth state
  useEffect(() => {
    ;(async () => {
      try {
        const me = await apiGet<AuthUser>('/api/auth/me')
        setUser(me)
      } catch {
        setView('login')
      } finally {
        setHydrated(true)
        setBooting(false)
      }
    })()
  }, [setUser, setView, setHydrated])

  if (booting || !hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingBlock label="Iniciando La Cafeta…" />
      </main>
    )
  }

  // If no user or view is login → show login
  if (!user || view === 'login') {
    return <LoginView />
  }

  switch (view) {
    case 'hub-admin':
      return <HubAdminView />
    case 'hub-empleado':
      return <HubEmpleadoView />
    case 'admin-productos':
      return <ProductosView />
    case 'admin-personal':
      return <PersonalView />
    case 'admin-asignar':
      return <AsignarTurnosView />
    case 'admin-protocolos':
      return <ProtocolosView />
    case 'admin-dashboard':
      return <DashboardView />
    case 'admin-empleados':
      return <EmployeesView />
    case 'admin-sandbox':
      return <SandboxView />
    case 'turno':
      return <TurnoView />
    case 'turno-calendario':
      return <CalendarioView />
    case 'turno-dashboard':
      return <DashboardEmpleadoView />
    default:
      return user.role === 'ADMIN' ? <HubAdminView /> : <HubEmpleadoView />
  }
}
