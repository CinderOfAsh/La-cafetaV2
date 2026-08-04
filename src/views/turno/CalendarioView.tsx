'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowLeftRight,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, ModalShell, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, post } from '@/lib/api'
import { toast } from 'sonner'
import { DOW_LABELS, MONTHS_ES, todayStr } from '@/lib/format'
import type { ShiftAssignment, ShiftSwap, SwapType } from '@/lib/types'

interface DbUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

type ViewMode = 'dia' | 'semana' | 'mes'

export function CalendarioView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)!
  const [mode, setMode] = useState<ViewMode>('mes')
  const [cursor, setCursor] = useState(() => new Date())
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [users, setUsers] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ShiftAssignment | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [as, us] = await Promise.all([
          get<ShiftAssignment[]>(`/api/shift-assignments?userId=${user.id}`),
          get<DbUser[]>('/api/users'),
        ])
        setAssignments(as)
        setUsers(us.filter((u) => u.id !== user.id && u.isActive))
      } catch {
        toast.error('No se pudieron cargar tus turnos')
      } finally {
        setLoading(false)
      }
    })()
  }, [user.id])

  function shiftLeft() {
    const d = new Date(cursor)
    if (mode === 'dia') d.setDate(d.getDate() - 1)
    else if (mode === 'semana') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setCursor(d)
  }
  function shiftRight() {
    const d = new Date(cursor)
    if (mode === 'dia') d.setDate(d.getDate() + 1)
    else if (mode === 'semana') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setCursor(d)
  }

  const label = useMemo(() => {
    if (mode === 'dia') {
      return cursor.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (mode === 'semana') {
      const start = new Date(cursor)
      const day = start.getDay()
      const offset = day === 0 ? -6 : 1 - day // Monday start
      start.setDate(start.getDate() + offset)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return `${MONTHS_ES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [cursor, mode])

  const visibleAssignments = useMemo(() => {
    if (mode === 'dia') {
      const ds = cursor.toISOString().slice(0, 10)
      return assignments.filter((a) => a.date === ds)
    }
    if (mode === 'semana') {
      const start = new Date(cursor)
      const day = start.getDay()
      const offset = day === 0 ? -6 : 1 - day
      start.setDate(start.getDate() + offset)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return assignments.filter((a) => {
        const d = new Date(a.date + 'T00:00:00')
        return d >= start && d < end
      })
    }
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const start = new Date(y, m, 1).toISOString().slice(0, 10)
    const end = new Date(y, m + 1, 0).toISOString().slice(0, 10)
    return assignments.filter((a) => a.date >= start && a.date <= end)
  }, [assignments, cursor, mode])

  // For month mode: render calendar grid
  const monthCells = useMemo(() => {
    if (mode !== 'mes') return []
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startOffset = first.getDay()
    const total = last.getDate()
    const cells: { date: string | null; day: number | null }[] = []
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null })
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d).toISOString().slice(0, 10)
      cells.push({ date, day: d })
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
    return cells
  }, [cursor, mode])

  return (
    <>
      <AppHeader title="Calendario" onBack={() => setView('hub-empleado')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex bg-muted/60 rounded-full p-1">
            {([
              ['dia', 'Día'],
              ['semana', 'Semana'],
              ['mes', 'Mes'],
            ] as const).map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  mode === id ? 'bg-card text-sage shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button className="btn-ghost p-2" onClick={shiftLeft} aria-label="Anterior">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-semibold min-w-[180px] text-center capitalize">{label}</div>
            <button className="btn-ghost p-2" onClick={shiftRight} aria-label="Siguiente">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              className="btn-outline text-xs ml-2"
              onClick={() => setCursor(new Date())}
            >
              Hoy
            </button>
          </div>
        </div>

        {loading ? (
          <Card><LoadingBlock label="Cargando calendario…" /></Card>
        ) : (
          <>
            {mode === 'mes' ? (
              <Card className="p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                  {DOW_LABELS.map((d) => (
                    <div key={d} className="text-center text-xs uppercase tracking-wide text-muted-foreground font-medium py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {monthCells.map((c, idx) => {
                    if (!c.date) return <div key={idx} className="aspect-square sm:aspect-[4/3]" />
                    const dayAssignments = visibleAssignments.filter((a) => a.date === c.date)
                    const isToday = c.date === todayStr()
                    return (
                      <div
                        key={idx}
                        className={`aspect-square sm:aspect-[4/3] rounded-lg border p-1.5 sm:p-2 text-left flex flex-col gap-1 transition-colors bg-card ${
                          isToday ? 'border-[color:var(--sage)]' : 'border-border'
                        }`}
                      >
                        <div className="text-xs font-medium">{c.day}</div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayAssignments.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setSelected(a)}
                              className="block w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded bg-[rgba(127,166,155,0.15)] text-sage hover:bg-[rgba(127,166,155,0.25)] truncate"
                            >
                              {a.shift?.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleAssignments.length === 0 ? (
                  <Card className="sm:col-span-2 lg:col-span-3">
                    <EmptyState
                      icon={<CalendarIcon className="w-6 h-6" />}
                      title="Sin turnos"
                      description="No tienes turnos asignados en este periodo."
                    />
                  </Card>
                ) : (
                  visibleAssignments
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((a) => (
                      <AssignmentCard key={a.id} a={a} onClick={() => setSelected(a)} />
                    ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {selected && (
        <SwapDialog
          assignment={selected}
          users={users}
          currentUserId={user.id}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            toast.success('Solicitud registrada')
          }}
        />
      )}
    </>
  )
}

function AssignmentCard({ a, onClick }: { a: ShiftAssignment; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-wellness hover-lift p-4 text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-foreground">{a.shift?.name}</p>
          <p className="text-sm text-muted-foreground">
            {a.shift?.startTime}–{a.shift?.endTime}
          </p>
        </div>
        <Badge variant="sage">{a.role}</Badge>
      </div>
      <p className="text-xs text-muted-foreground capitalize">
        {new Date(a.date + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>
    </button>
  )
}

function SwapDialog({
  assignment,
  users,
  currentUserId,
  onClose,
  onSaved,
}: {
  assignment: ShiftAssignment
  users: DbUser[]
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<SwapType>('swap')
  const [replacementId, setReplacementId] = useState('')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!replacementId) {
      toast.error('Selecciona un compañero')
      return
    }
    setSaving(true)
    try {
      await post('/api/shift-swaps', {
        originalUserId: currentUserId,
        replacementUserId: replacementId,
        shiftAssignmentId: assignment.id,
        type,
      })
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'No se pudo registrar el cambio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Intercambiar turno"
      description={`${assignment.shift?.name} · ${new Date(assignment.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`}
      size="sm"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-sage text-sm" onClick={confirm} disabled={saving}>
            <ArrowLeftRight className="w-4 h-4" /> {saving ? 'Enviando…' : 'Confirmar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Tipo de cambio</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['swap', 'Intercambio', 'Intercambias tu turno con tu compañero'],
              ['substitute', 'Sustitución', 'Tu compañero cubre tu turno esta vez'],
            ] as const).map(([id, lbl, desc]) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  type === id ? 'border-[color:var(--sage)] bg-accent' : 'border-border hover:border-[color:var(--sage)]'
                }`}
              >
                <p className="text-sm font-medium">{lbl}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Compañero</label>
          <select
            className="input-wellness"
            value={replacementId}
            onChange={(e) => setReplacementId(e.target.value)}
          >
            <option value="">— Selecciona —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </ModalShell>
  )
}
