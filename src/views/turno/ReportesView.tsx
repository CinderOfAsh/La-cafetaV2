'use client'

import { useEffect, useState } from 'react'
import { Send, Bug, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, LoadingBlock, EmptyState, Badge } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, post } from '@/lib/api'
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

export function ReportesView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await get<Report[]>('/api/reports?mine=1')
      setReports(data)
    } catch {
      toast.error('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Rellena el título y la descripción')
      return
    }
    setSubmitting(true)
    try {
      await post('/api/reports', { title: title.trim(), description: description.trim() })
      toast.success('Reporte enviado al admin')
      setTitle('')
      setDescription('')
      load()
    } catch {
      toast.error('No se pudo enviar el reporte')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AppHeader
        title="Reportes"
        onBack={() => setView('hub-empleado')}
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent text-sage flex items-center justify-center">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl">Reportar un bug</h2>
              <p className="text-sm text-muted-foreground">
                Como <strong>{user?.name}</strong>, describe el problema que has encontrado.
                El admin lo recibirá y podrá corregirlo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">
                Título corto
              </label>
              <input
                type="text"
                className="input-wellness w-full"
                placeholder="ej: El POS no abre los packs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                maxLength={120}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">
                Descripción detallada
              </label>
              <textarea
                className="input-wellness w-full min-h-[120px]"
                placeholder="Explica qué estabas haciendo, qué esperabas que pasara y qué pasó realmente…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                maxLength={2000}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-sage"
                disabled={submitting || !title.trim() || !description.trim()}
              >
                <Send className="w-4 h-4" /> {submitting ? 'Enviando…' : 'Enviar al admin'}
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="font-serif text-lg mb-3">Mis reportes enviados ({reports.length})</h3>
          {loading ? (
            <LoadingBlock label="Cargando…" />
          ) : reports.length === 0 ? (
            <EmptyState title="Sin reportes" description="Aún no has enviado ningún reporte." />
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="p-3 rounded-lg bg-muted/40 border-l-4 border-l-[color:var(--accent)]"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <ReportStatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                    {r.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt.split('T')[0])}
                    {r.seenByAdmin && (
                      <span className="ml-2 inline-flex items-center gap-1 text-sage">
                        <CheckCircle2 className="w-3 h-3" /> visto por admin
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="mt-6">
          <button
            onClick={() => setView('hub-empleado')}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </button>
        </div>
      </main>
    </>
  )
}

function ReportStatusBadge({ status }: { status: string }) {
  if (status === 'RESOLVED') return <Badge variant="sage">Resuelto</Badge>
  if (status === 'DISMISSED') return <Badge variant="muted">Descartado</Badge>
  return <Badge variant="warn">Abierto</Badge>
}
