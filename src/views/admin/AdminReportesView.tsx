'use client'

import { useEffect, useState } from 'react'
import { Bug, ArrowLeft, CheckCircle2, X, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, LoadingBlock, EmptyState, Badge, ModalShell } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { formatDate } from '@/lib/format'

interface ReportUser {
  id: string
  name: string
  email: string
  role: string
}

interface Report {
  id: string
  userId: string
  title: string
  description: string
  status: string
  seenByAdmin: boolean
  createdAt: string
  user: ReportUser
}

export function AdminReportesView() {
  const setView = useAppStore((s) => s.setView)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [popup, setPopup] = useState<Report | null>(null)

  async function load(markSeen = false) {
    setLoading(true)
    try {
      const data = await get<Report[]>('/api/reports')
      setReports(data)
      // Mostrar popup automático del primero no visto
      if (markSeen) {
        const unseen = data.find((r) => !r.seenByAdmin && r.status === 'OPEN')
        if (unseen) {
          setPopup(unseen)
          // Marcar como visto en BD
          try {
            await put(`/api/reports/${unseen.id}`, { seenByAdmin: true })
            load(false)
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      toast.error('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setStatus(id: string, status: string) {
    try {
      await put(`/api/reports/${id}`, { status })
      toast.success('Estado actualizado')
      load()
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este reporte?')) return
    try {
      await del(`/api/reports/${id}`)
      toast.success('Reporte eliminado')
      load()
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  const openReports = reports.filter((r) => r.status === 'OPEN')
  const resolvedReports = reports.filter((r) => r.status !== 'OPEN')

  return (
    <>
      <AppHeader title="Reportes de bugs" onBack={() => setView('hub-admin')} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 border-l-4 border-l-[color:var(--accent)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-sage flex items-center justify-center">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl">Bugs reportados</h2>
              <p className="text-sm text-muted-foreground">
                Los empleados envían reportes aquí cuando encuentran un bug. Pulsa en uno para
                revisarlo, marcarlo como resuelto o descartarlo.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <Badge variant="warn">{openReports.length} abiertos</Badge>
            <Badge variant="sage">{resolvedReports.length} cerrados</Badge>
          </div>
        </Card>

        {loading ? (
          <LoadingBlock label="Cargando reportes…" />
        ) : reports.length === 0 ? (
          <EmptyState
            title="Sin reportes"
            description="No hay reportes de bugs por ahora. ¡Buen trabajo!"
          />
        ) : (
          <div className="space-y-4">
            {openReports.length > 0 && (
              <div>
                <h3 className="font-serif text-lg mb-2">Abiertos</h3>
                <ul className="space-y-2">
                  {openReports.map((r) => (
                    <ReportRow
                      key={r.id}
                      report={r}
                      onOpen={() => {
                        setPopup(r)
                        if (!r.seenByAdmin) {
                          put(`/api/reports/${r.id}`, { seenByAdmin: true }).then(() =>
                            load(false)
                          )
                        }
                      }}
                      onResolve={() => setStatus(r.id, 'RESOLVED')}
                      onDismiss={() => setStatus(r.id, 'DISMISSED')}
                      onDelete={() => remove(r.id)}
                    />
                  ))}
                </ul>
              </div>
            )}

            {resolvedReports.length > 0 && (
              <div>
                <h3 className="font-serif text-lg mb-2 mt-6">Cerrados</h3>
                <ul className="space-y-2">
                  {resolvedReports.map((r) => (
                    <ReportRow
                      key={r.id}
                      report={r}
                      onOpen={() => setPopup(r)}
                      onResolve={() => setStatus(r.id, 'OPEN')}
                      onDismiss={() => setStatus(r.id, 'OPEN')}
                      onDelete={() => remove(r.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => setView('hub-admin')}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </button>
        </div>
      </main>

      {/* Popup del reporte */}
      {popup && (
        <ModalShell open={!!popup} onClose={() => setPopup(null)} title={popup.title} size="lg">
          <div className="p-6">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent text-sage flex items-center justify-center flex-shrink-0">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl">{popup.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reportado por <strong>{popup.user.name}</strong>
                    {popup.user.email && (
                      <span className="text-xs ml-1">({popup.user.email})</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(popup.createdAt.split('T')[0])}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPopup(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-muted/40 p-4 my-4 max-h-64 overflow-y-auto custom-scroll">
              <p className="text-sm whitespace-pre-wrap">{popup.description}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {popup.status === 'OPEN' ? (
                <>
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => {
                      setStatus(popup.id, 'DISMISSED')
                      setPopup(null)
                    }}
                  >
                    Descartar
                  </button>
                  <button
                    className="btn-sage text-sm"
                    onClick={() => {
                      setStatus(popup.id, 'RESOLVED')
                      setPopup(null)
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar como resuelto
                  </button>
                </>
              ) : (
                <button
                  className="btn-secondary text-sm"
                  onClick={() => {
                    setStatus(popup.id, 'OPEN')
                    setPopup(null)
                  }}
                >
                  Reabrir
                </button>
              )}
              <button
                className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-3 py-2"
                onClick={() => {
                  remove(popup.id)
                  setPopup(null)
                }}
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </>
  )
}

function ReportRow({
  report,
  onOpen,
  onResolve,
  onDismiss,
  onDelete,
}: {
  report: Report
  onOpen: () => void
  onResolve: () => void
  onDismiss: () => void
  onDelete: () => void
}) {
  return (
    <li className="p-3 rounded-lg bg-card border border-border hover:border-accent transition">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate">{report.title}</p>
            {!report.seenByAdmin && report.status === 'OPEN' && (
              <span className="w-2 h-2 rounded-full bg-[color:var(--accent)]" title="Nuevo" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            por <strong>{report.user.name}</strong> · {formatDate(report.createdAt.split('T')[0])}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          {report.status === 'OPEN' ? (
            <Badge variant="warn">Abierto</Badge>
          ) : report.status === 'RESOLVED' ? (
            <Badge variant="sage">Resuelto</Badge>
          ) : (
            <Badge variant="muted">Descartado</Badge>
          )}
        </div>
      </div>
      {report.status === 'OPEN' && (
        <div className="flex gap-2 mt-2 justify-end">
          <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
            Descartar
          </button>
          <button onClick={onResolve} className="text-xs text-sage hover:underline px-2 py-1">
            Marcar resuelto
          </button>
          <button onClick={onDelete} className="text-xs text-red-600 hover:text-red-700 px-2 py-1">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </li>
  )
}
