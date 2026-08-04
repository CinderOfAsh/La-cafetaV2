'use client'

import { ShoppingBag, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { useAppStore, type View } from '@/lib/store'
import { AppHeader } from '@/components/AppHeader'
import { PageHeader } from '@/components/ui-bits'

const cards: { id: string; title: string; description: string; icon: typeof ShoppingBag; view: View }[] = [
  {
    id: 'turno',
    title: 'Mi Turno',
    description: 'Punto de venta y panel de comandas.',
    icon: ShoppingBag,
    view: 'turno',
  },
  {
    id: 'calendario',
    title: 'Calendario',
    description: 'Tus turnos asignados e intercambios.',
    icon: Calendar,
    view: 'turno-calendario',
  },
  {
    id: 'dashboard',
    title: 'Mi Dashboard',
    description: 'Tus ventas, métodos de pago y productividad.',
    icon: BarChart3,
    view: 'turno-dashboard',
  },
]

export function HubEmpleadoView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)

  return (
    <>
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          eyebrow="Bienvenido"
          title={`Hola${user ? `, ${user.name.split(' ')[0]}` : ''}`}
          description="Selecciona una opción para empezar tu jornada."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl">
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
