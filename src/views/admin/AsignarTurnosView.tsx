'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2, Clock, AlertTriangle } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, ModalShell, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, post, del } from '@/lib/api'
import { toast } from 'sonner'
import { DOW_LABELS, MONTHS_ES, todayStr, mondayFirstOffset, parseDays } from '@/lib/format'
import type { Shift, ShiftAssignment } from '@/lib/types'

interface DbUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export function AsignarTurnosView() {
  const setView = useAppStore((s) => s.setView)
  const selectedUserId = useAppStore((s) => s.selectedUserId)
  const [users, setUsers] = useState<DbUser[]>([])
  const [user, setUser] = useState<DbUser | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  // ALL assignments for the visible month (across ALL users, so we can display them in cells)
  const [allAssignments, setAllAssignments] = useState<ShiftAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Load users + shifts once
  useEffect(() => {
    ;(async () => {
      try {
        const [u, s] = await Promise.all([get<DbUser[]>('/api/users'), get<Shift[]>('/api/shifts')])
        setUsers(u)
        setShifts(s)
      } catch {
        toast.error('No se pudieron cargar usuarios y turnos')
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    const u = users.find((x) => x.id === selectedUserId)
    if (u) setUser(u)
  }, [selectedUserId, users])

  // Load ALL assignments for the visible month (so the calendar shows everyone's shifts)
  useEffect(() => {
    if (!selectedUserId) return
    ;(async () => {
      setLoading(true)
      try {
        const y = monthCursor.getFullYear()
        const m = monthCursor.getMonth()
        const start = new Date(y, m, 1).toISOString().slice(0, 10)
        const end = new Date(y, m + 1, 0).toISOString().slice(0, 10)
        // Fetch ALL assignments (no userId filter) — we'll filter client-side by date
        const data = await get<ShiftAssignment[]>(`/api/shift-assignments`)
        setAllAssignments(data.filter((a) => a.date >= start && a.date <= end))
      } catch {
        toast.error('No se pudieron cargar las asignaciones')
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedUserId, monthCursor])

  // Map of date -> assignments (all users)
  const byDate = useMemo(() => {
    const map = new Map<string, ShiftAssignment[]>()
    for (const a of allAssignments) {
      const arr = map.get(a.date) || []
      arr.push(a)
      map.set(a.date, arr)
    }
    return map
  }, [allAssignments])

  const monthDays = useMemo(() => {
    const y = monthCursor.getFullYear()
    const m = monthCursor.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    // Monday-first offset
    const startOffset = mondayFirstOffset(first.getDay())
    const total = last.getDate()
    const cells: { date: string | null; day: number | null }[] = []
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null })
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d).toISOString().slice(0, 10)
      cells.push({ date, day: d })
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
    return cells
  }, [monthCursor])

  return (
    <>
      <AppHeader
        title={`Asignar turnos${user ? ` · ${user.name}` : ''}`}
        onBack={() => setView('admin-personal')}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedUserId ? (
          <Card>
            <EmptyState
              icon={<CalendarDays className="w-6 h-6" />}
              title="Selecciona un empleado"
              description="Vuelve al panel de personal y usa el icono del calendario."
            />
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="section-title text-2xl sm:text-3xl">
                  Calendario de {user?.name || 'empleado'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Click en un día para asignar un turno. Solo se pueden asignar turnos en los días programados (L-V).
                  Verde = libre · Amarillo = 1 persona · Rojo = lleno (2).
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn-ghost p-2"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-semibold min-w-[140px] text-center">
                  {MONTHS_ES[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                </div>
                <button
                  className="btn-ghost p-2"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  className="btn-outline text-xs ml-2"
                  onClick={() => setMonthCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                >
                  Hoy
                </button>
              </div>
            </div>

            <Card className="p-3 sm:p-4">
              {loading ? (
                <LoadingBlock label="Cargando calendario…" />
              ) : (
                <>
                  {/* DOW header — Monday first */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {DOW_LABELS.map((d) => (
                      <div key={d} className="text-center text-xs uppercase tracking-wide text-muted-foreground font-medium py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {monthDays.map((c, idx) => {
                      if (!c.date) return <div key={idx} className="aspect-square sm:aspect-[4/3]" />
                      const dayAssignments = byDate.get(c.date) || []
                      const count = dayAssignments.length
                      const isToday = c.date === todayStr()
                      // Dot color reflects if there's any room left across all shifts that day
                      const dotClass =
                        count === 0 ? 'bg-[color:var(--sage)]' : count === 1 ? 'bg-amber-400' : 'bg-[color:var(--warn)]'
                      // Check if this day-of-week has any shift programmed
                      const jsDow = new Date(c.date + 'T00:00:00').getDay()
                      const availableShifts = shifts.filter((s) => parseDays(s.daysOfWeek).includes(jsDow))
                      const isAssignable = availableShifts.length > 0
                      return (
                        <button
                          key={idx}
                          onClick={() => isAssignable && setSelectedDate(c.date)}
                          disabled={!isAssignable}
                          className={`aspect-square sm:aspect-[4/3] rounded-lg border p-1 sm:p-1.5 text-left flex flex-col gap-0.5 transition-colors ${
                            isAssignable
                              ? 'hover:border-[color:var(--sage)] hover:bg-accent cursor-pointer'
                              : 'opacity-40 cursor-not-allowed'
                          } ${
                            isToday ? 'border-[color:var(--sage)]' : 'border-border'
                          } bg-card overflow-hidden`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{c.day}</span>
                            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                          </div>
                          {dayAssignments.length > 0 && (
                            <div className="text-[9px] sm:text-[10px] leading-tight text-muted-foreground overflow-hidden space-y-0.5">
                              {/* Group by shift */}
                              {(() => {
                                const byShift = new Map<string, ShiftAssignment[]>()
                                for (const a of dayAssignments) {
                                  const arr = byShift.get(a.shiftId) || []
                                  arr.push(a)
                                  byShift.set(a.shiftId, arr)
                                }
                                return Array.from(byShift.entries()).slice(0, 2).map(([sid, arr]) => (
                                  <div key={sid} className="truncate">
                                    <span className="font-medium text-sage">{arr[0]?.shift?.name}:</span>{' '}
                                    {arr.map((a, i) => (
                                      <span key={a.id}>
                                        {i > 0 && ', '}
                                        {a.user?.name?.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>
                                ))
                              })()}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </main>

      {selectedDate && (
        <DayDialog
          date={selectedDate}
          userId={selectedUserId!}
          shifts={shifts}
          existing={byDate.get(selectedDate) || []}
          onClose={() => setSelectedDate(null)}
          onChanged={() => {
            // reload ALL assignments for the month
            ;(async () => {
              const y = monthCursor.getFullYear()
              const m = monthCursor.getMonth()
              const start = new Date(y, m, 1).toISOString().slice(0, 10)
              const end = new Date(y, m + 1, 0).toISOString().slice(0, 10)
              const data = await get<ShiftAssignment[]>(`/api/shift-assignments`)
              setAllAssignments(data.filter((a) => a.date >= start && a.date <= end))
              setSelectedDate(null)
            })()
          }}
        />
      )}
    </>
  )
}

function DayDialog({
  date,
  userId,
  shifts,
  existing,
  onClose,
  onChanged,
}: {
  date: string
  userId: string
  shifts: Shift[]
  existing: ShiftAssignment[]
  onClose: () => void
  onChanged: () => void
}) {
  // Filter shifts to only those programmed for this day-of-week
  const jsDow = new Date(date + 'T00:00:00').getDay()
  const availableShifts = shifts.filter((s) => parseDays(s.daysOfWeek).includes(jsDow))

  const [shiftId, setShiftId] = useState(availableShifts[0]?.id ?? '')
  const [role, setRole] = useState('CAMARERO')
  const [saving, setSaving] = useState(false)

  // Existing assignments for the SELECTED shift only (not all day)
  const existingForShift = existing.filter((a) => a.shiftId === shiftId)
  const shiftFull = existingForShift.length >= 2

  // Roles already taken for this shift
  const takenRoles = new Set(existingForShift.map((a) => a.role))
  // Available roles = those not taken
  const availableRoles = (['CAMARERO', 'COCINERO'] as const).filter((r) => !takenRoles.has(r))
  // If current role is taken, switch to first available
  if (takenRoles.has(role) && availableRoles.length > 0 && role !== availableRoles[0]) {
    setRole(availableRoles[0])
  }

  async function assign() {
    if (!shiftId) {
      toast.error('No hay turnos disponibles para este día')
      return
    }
    if (shiftFull) {
      toast.error('Este turno ya tiene 2 personas asignadas. No se puede añadir más.')
      return
    }
    if (takenRoles.has(role)) {
      toast.error(`El rol ${role} ya está asignado a este turno.`)
      return
    }
    setSaving(true)
    try {
      await post('/api/shift-assignments', { shiftId, userId, date, role })
      toast.success('Turno asignado')
      onChanged()
    } catch (e: any) {
      toast.error(e.message || 'No se pudo asignar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    try {
      await del(`/api/shift-assignments/${id}`)
      toast.success('Asignación eliminada')
      onChanged()
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title={`Asignar turno — ${new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      size="md"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>Cerrar</button>
          <button
            className="btn-sage text-sm"
            onClick={assign}
            disabled={saving || availableShifts.length === 0 || shiftFull || availableRoles.length === 0}
          >
            <Plus className="w-4 h-4" /> {saving ? 'Asignando…' : 'Asignar'}
          </button>
        </>
      }
    >
      {availableShifts.length === 0 && (
        <div className="mb-4 p-3 rounded-lg bg-[rgba(199,123,92,0.10)] text-[color:var(--warn)] text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>No hay turnos programados para este día de la semana.</span>
        </div>
      )}

      {/* Existing — show ALL assignments for this date, grouped by shift */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Turnos asignados este día
        </p>
        {existing.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie asignado todavía.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const byShift = new Map<string, ShiftAssignment[]>()
              for (const a of existing) {
                const arr = byShift.get(a.shiftId) || []
                arr.push(a)
                byShift.set(a.shiftId, arr)
              }
              return Array.from(byShift.entries()).map(([sid, arr]) => {
                const shift = arr[0]?.shift
                const isFull = arr.length >= 2
                return (
                  <div key={sid} className="rounded-lg bg-muted/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sage" />
                        <div>
                          <p className="text-sm font-medium">{shift?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {shift?.startTime}–{shift?.endTime}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isFull ? 'warn' : 'muted'}>
                        {arr.length}/2
                      </Badge>
                    </div>
                    <div className="space-y-1 ml-6">
                      {arr.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <span>
                            <span className="font-medium">{a.user?.name}</span>
                            <Badge variant="muted" className="ml-2">{a.role}</Badge>
                          </span>
                          <button
                            className="btn-ghost p-1 text-muted-foreground hover:text-[color:var(--warn)]"
                            onClick={() => remove(a.id)}
                            aria-label="Eliminar asignación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* New assignment form — only show if there are available shifts and roles */}
      {availableShifts.length > 0 && (
        <>
          {shiftFull ? (
            <div className="p-3 rounded-lg bg-[rgba(199,123,92,0.10)] text-[color:var(--warn)] text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                El turno <strong>{availableShifts.find((s) => s.id === shiftId)?.name}</strong> ya tiene 2 personas asignadas.
                No se puede añadir más gente a este turno. Prueba con otro turno.
              </span>
            </div>
          ) : availableRoles.length === 0 ? (
            <div className="p-3 rounded-lg bg-[rgba(199,123,92,0.10)] text-[color:var(--warn)] text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Ambos roles (cocinero y camarero) ya están asignados a este turno.
                No se puede añadir más gente.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">Turno</label>
                <select
                  className="input-wellness"
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                >
                  {availableShifts.map((s) => {
                    const count = existing.filter((a) => a.shiftId === s.id).length
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime}–{s.endTime}){count > 0 ? ` · ${count}/2` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Rol</label>
                <select
                  className="input-wellness"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {/* Only show available (not taken) roles */}
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </ModalShell>
  )
}
