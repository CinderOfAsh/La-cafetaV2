'use client'

import {
  Package,
  Users,
  ClipboardList,
  BarChart3,
  FlaskConical,
  ArrowRight,
  UserCircle,
} from 'lucide-react'
import { useAppStore, type View } from '@/lib/store'
import { AppHeader } from '@/components/AppHeader'
import { PageHeader } from '@/components/ui-bits'

interface HubCard {
  id: string
  title: string
  description: string
  icon: typeof Package
  view: View
  legacy?: boolean
}

const cards: HubCard[] = [
  {
    id: 'productos',
    title: 'Productos',
    description: 'Catálogo, materias primas, recetas, lista de la compra y gastos.',
    icon: Package,
    view: 'admin-productos',
  },
  {
    id: 'personal',
    title: 'Gestión de Personal',
    description: 'Empleados, turnos y asignaciones.',
    icon: Users,
    view: 'admin-personal',
  },
  {
    id: 'protocolos',
    title: 'Protocolos',
    description: 'Apertura, cierre, cocina y producto.',
    icon: ClipboardList,
    view: 'admin-protocolos',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Métricas de ventas, empleados y stock.',
    icon: BarChart3,
    view: 'admin-dashboard',
  },
  {
    id: 'empleados-stats',
    title: 'Empleados',
    description: 'Estadísticas por empleado: turnos, intercambios, roles y ventas.',
    icon: UserCircle,
    view: 'admin-empleados',
  },
  {
    id: 'sandbox',
    title: 'Sandbox',
    description: 'Punto de venta de prueba para administrador.',
    icon: FlaskConical,
    view: 'admin-sandbox',
  },
]

export function HubAdminView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)

  return (
    <>
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          eyebrow="Bienvenido"
          title={`Panel de administración${user ? `, ${user.name}` : ''}`}
          description="Gestiona productos, personal, turnos, protocolos y revisa tus métricas."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon
            return (
              <button
                key={c.id}
                onClick={() => setView(c.view)}
                className="card-wellness hover-lift p-5 sm:p-6 text-left animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-accent text-sage flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-2" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </button>
            )
          })}
        </div>
      </main>
    </>
  )
}
