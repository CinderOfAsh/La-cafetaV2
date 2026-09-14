'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  Users,
  ClipboardList,
  BarChart3,
  FlaskConical,
  ArrowRight,
  UserCircle,
  Bug,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { useAppStore, type View } from '@/lib/store'
import { AppHeader } from '@/components/AppHeader'
import { PageHeader } from '@/components/ui-bits'
import { ModalShell, Badge } from '@/components/shared'
import { get, put, del } from '@/lib/api'
import { toast } from 'sonner'

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
  {
    id: 'reportes',
    title: 'Reportes de bugs',
    description: 'Bugs reportados por los empleados. Resuélvelos o descártalos.',
    icon: Bug,
    view: 'admin-reportes',
  },
]

export function HubAdminView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [popupReport, setPopupReport] = useState<{
    id: string
    title: string
    description: string
    userName: string
    userEmail: string
    createdAt: string
  } | null>(null)

  // Auto-popup del primer reporte no visto al cargar el hub admin
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const reports = await get<any[]>('/api/reports')
        if (cancelled) return
        const unseen = reports.find((r) => !r.seenByAdmin && r.status === 'OPEN')
        if (unseen) {
          setPopupReport({
            id: unseen.id,
            title: unseen.title,
            description: unseen.description,
            userName: unseen.user?.name || 'Desconocido',
            userEmail: unseen.user?.email || '',
            createdAt: unseen.createdAt,
          })
          // Marcar como visto (silencioso)
          try { await put(`/api/reports/${unseen.id}`, { seenByAdmin: true }) } catch {}
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [])

  async function setStatus(id: string, status: string) {
    try {
      await put(`/api/reports/${id}`, { status })
      toast.success('Estado actualizado')
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  async function removeReport(id: string) {
    try {
      await del(`/api/reports/${id}`)
      toast.success('Reporte eliminado')
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

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

      {/* Popup automatico de reporte nuevo */}
      {popupReport && (
        <ModalShell
          open={!!popupReport}
          onClose={() => setPopupReport(null)}
          title="¡Nuevo reporte de bug!"
          size="lg"
        >
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent text-sage flex items-center justify-center flex-shrink-0">
                <Bug className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <Badge variant="warn">Abierto</Badge>
                <h3 className="font-serif text-xl mt-2">{popupReport.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reportado por <strong>{popupReport.userName}</strong>
                  {popupReport.userEmail && (
                    <span className="text-xs ml-1">({popupReport.userEmail})</span>
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-4 my-4 max-h-64 overflow-y-auto custom-scroll">
              <p className="text-sm whitespace-pre-wrap">{popupReport.description}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-3 py-2"
                onClick={() => {
                  removeReport(popupReport.id)
                  setPopupReport(null)
                }}
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => {
                  setStatus(popupReport.id, 'DISMISSED')
                  setPopupReport(null)
                }}
              >
                Descartar
              </button>
              <button
                className="btn-sage text-sm"
                onClick={() => {
                  setStatus(popupReport.id, 'RESOLVED')
                  setPopupReport(null)
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como resuelto
              </button>
            </div>

            <button
              onClick={() => setPopupReport(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </ModalShell>
      )}
    </>
  )
}
