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
        // Fetch ALL assignments (not just mine) so the calendar shows who's working each shift
        const [as, us] = await Promise.all([
          get<ShiftAssignment[]>(`/api/shift-assignments`),
          get<DbUser[]>('/api/users'),
        ])
        setAssignments(as)
        setUsers(us.filter((u) => u.id !== user.id && u.isActive))
      } catch {
        toast.error('No se pudieron cargar los turnos')
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
                    // Group by shift to show "Mañana: Aitana (cocinero), Jose G (camarero)"
                    const byShift = new Map<string, ShiftAssignment[]>()
                    for (const a of dayAssignments) {
                      const key = a.shiftId
                      const arr = byShift.get(key) || []
                      arr.push(a)
                      byShift.set(key, arr)
                    }
                    const isToday = c.date === todayStr()
                    return (
                      <div
                        key={idx}
                        className={`aspect-square sm:aspect-[4/3] rounded-lg border p-1 sm:p-1.5 text-left flex flex-col gap-0.5 transition-colors bg-card overflow-hidden ${
                          isToday ? 'border-[color:var(--sage)]' : 'border-border'
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs font-medium">{c.day}</div>
                        <div className="space-y-0.5 overflow-hidden">
                          {Array.from(byShift.entries()).map(([shiftId, arr]) => {
                            const shift = arr[0]?.shift
                            const isMine = arr.some((a) => a.userId === user.id)
                            return (
                              <button
                                key={shiftId}
                                onClick={() => {
                                  // If I have an assignment in this shift, select mine (for swap)
                                  const mine = arr.find((a) => a.userId === user.id)
                                  if (mine) setSelected(mine)
                                }}
                                disabled={!arr.some((a) => a.userId === user.id)}
                                className={`block w-full text-left text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                                  isMine
                                    ? 'bg-[rgba(127,166,155,0.20)] text-sage hover:bg-[rgba(127,166,155,0.30)] cursor-pointer'
                                    : 'bg-muted/60 text-muted-foreground cursor-default'
                                }`}
                                title={arr.map((a) => `${a.user?.name} (${a.role})`).join(', ')}
                              >
                                <span className="font-medium">{shift?.name}:</span>{' '}
                                {arr.map((a, i) => (
                                  <span key={a.id}>
                                    {i > 0 && ', '}
                                    {a.user?.name?.split(' ')[0]}{' '}
                                    <span className="opacity-70">({a.role === 'COCINERO' ? 'coc' : 'cam'})</span>
                                  </span>
                                ))}
                              </button>
                            )
                          })}
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
                      description="No hay turnos asignados en este periodo."
                    />
                  </Card>
                ) : (
                  // Group by shift+date so we show a card per shift with all its people
                  (() => {
                    const groups = new Map<string, ShiftAssignment[]>()
                    for (const a of visibleAssignments) {
                      const key = `${a.date}_${a.shiftId}`
                      const arr = groups.get(key) || []
                      arr.push(a)
                      groups.set(key, arr)
                    }
                    return Array.from(groups.entries())
                      .sort(([ka], [kb]) => ka.localeCompare(kb))
                      .map(([key, arr]) => (
                        <ShiftGroupCard
                          key={key}
                          assignments={arr}
                          currentUserId={user.id}
                          onClick={(a) => setSelected(a)}
                        />
                      ))
                  })()
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

function ShiftGroupCard({
  assignments,
  currentUserId,
  onClick,
}: {
  assignments: ShiftAssignment[]
  currentUserId: string
  onClick: (a: ShiftAssignment) => void
}) {
  const a = assignments[0]
  const shift = a.shift
  const mine = assignments.find((x) => x.userId === currentUserId)

  return (
    <div className="card-wellness p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">{shift?.name}</p>
          <p className="text-sm text-muted-foreground">
            {shift?.startTime}–{shift?.endTime}
          </p>
        </div>
        {mine && <Badge variant="sage">Tu turno</Badge>}
      </div>
      <p className="text-xs text-muted-foreground capitalize mb-3">
        {new Date(a.date + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>
      <div className="space-y-1.5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsables</p>
        {assignments.map((asg) => (
          <button
            key={asg.id}
            onClick={() => asg.userId === currentUserId && onClick(asg)}
            disabled={asg.userId !== currentUserId}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm ${
              asg.userId === currentUserId
                ? 'bg-[rgba(127,166,155,0.15)] hover:bg-[rgba(127,166,155,0.25)] cursor-pointer'
                : 'bg-muted/40 cursor-default'
            }`}
          >
            <span className="font-medium">
              {asg.user?.name}
              {asg.userId === currentUserId && <span className="text-sage ml-1">(tú)</span>}
            </span>
            <Badge variant={asg.role === 'COCINERO' ? 'sage' : 'muted'}>{asg.role}</Badge>
          </button>
        ))}
      </div>
      {mine && (
        <button
          onClick={() => onClick(mine)}
          className="btn-outline text-xs w-full mt-3"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" /> Intercambiar / ceder
        </button>
      )}
    </div>
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
