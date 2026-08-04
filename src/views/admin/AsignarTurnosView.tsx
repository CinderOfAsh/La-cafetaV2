'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2, Clock } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, ModalShell, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, post, del } from '@/lib/api'
import { toast } from 'sonner'
import { DOW_LABELS, MONTHS_ES, todayStr } from '@/lib/format'
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
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
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

  // Load assignments for the visible month
  useEffect(() => {
    if (!selectedUserId) return
    ;(async () => {
      setLoading(true)
      try {
        const y = monthCursor.getFullYear()
        const m = monthCursor.getMonth()
        const start = new Date(y, m, 1).toISOString().slice(0, 10)
        const end = new Date(y, m + 1, 0).toISOString().slice(0, 10)
        // fetch all assignments for user within month window
        const all: ShiftAssignment[] = []
        // We can only filter by userId; date filter is single date — fetch all for user, filter client-side
        const data = await get<ShiftAssignment[]>(`/api/shift-assignments?userId=${selectedUserId}`)
        for (const a of data) {
          if (a.date >= start && a.date <= end) all.push(a)
        }
        setAssignments(all)
      } catch {
        toast.error('No se pudieron cargar las asignaciones')
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedUserId, monthCursor])

  // Map of date -> assignments
  const byDate = useMemo(() => {
    const map = new Map<string, ShiftAssignment[]>()
    for (const a of assignments) {
      const arr = map.get(a.date) || []
      arr.push(a)
      map.set(a.date, arr)
    }
    return map
  }, [assignments])

  const monthDays = useMemo(() => {
    const y = monthCursor.getFullYear()
    const m = monthCursor.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startOffset = first.getDay() // 0=Sun
    const total = last.getDate()
    const cells: { date: string | null; day: number | null }[] = []
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null })
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d).toISOString().slice(0, 10)
      cells.push({ date, day: d })
    }
    // pad to multiple of 7
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="section-title text-2xl sm:text-3xl">
                  Calendario de {user?.name || 'empleado'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Click en un día para asignar un turno. Verde = libre · Amarillo = 1 · Rojo = lleno (2).
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
                  {/* DOW header */}
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
                      const dotClass =
                        count === 0 ? 'bg-[color:var(--sage)]' : count === 1 ? 'bg-amber-400' : 'bg-[color:var(--warn)]'
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(c.date)}
                          className={`aspect-square sm:aspect-[4/3] rounded-lg border p-1.5 sm:p-2 text-left flex flex-col gap-1 transition-colors hover:border-[color:var(--sage)] hover:bg-accent ${
                            isToday ? 'border-[color:var(--sage)]' : 'border-border'
                          } bg-card`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{c.day}</span>
                            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                          </div>
                          {dayAssignments.length > 0 && (
                            <div className="text-[10px] leading-tight text-muted-foreground hidden sm:block overflow-hidden">
                              {dayAssignments.slice(0, 2).map((a) => (
                                <div key={a.id} className="truncate">
                                  {a.shift?.startTime} {a.shift?.name}
                                </div>
                              ))}
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
            // reload assignments for the month
            ;(async () => {
              const y = monthCursor.getFullYear()
              const m = monthCursor.getMonth()
              const start = new Date(y, m, 1).toISOString().slice(0, 10)
              const end = new Date(y, m + 1, 0).toISOString().slice(0, 10)
              const data = await get<ShiftAssignment[]>(`/api/shift-assignments?userId=${selectedUserId}`)
              setAssignments(data.filter((a) => a.date >= start && a.date <= end))
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
  const [shiftId, setShiftId] = useState(shifts[0]?.id ?? '')
  const [role, setRole] = useState('CAMARERO')
  const [saving, setSaving] = useState(false)
  // Fetch ALL assignments for this date (not just the selected user's) so we can validate role uniqueness
  const [allForDate, setAllForDate] = useState<ShiftAssignment[]>(existing)

  useEffect(() => {
    ;(async () => {
      try {
        const all = await get<ShiftAssignment[]>(`/api/shift-assignments?date=${date}`)
        setAllForDate(all)
      } catch {
        setAllForDate(existing)
      }
    })()
  }, [date, existing])

  const full = allForDate.length >= 2

  // Find which roles are already taken for the selected shift+date (across ALL users)
  const existingForShift = allForDate.filter((a) => a.shiftId === shiftId)
  const takenRoles = new Set(existingForShift.map((a) => a.role))
  const roleTaken = takenRoles.has(role)

  async function assign() {
    if (!shiftId) {
      toast.error('Selecciona un turno')
      return
    }
    if (roleTaken) {
      toast.error(`Ya hay un ${role.toLowerCase()} asignado a este turno. Elige el otro rol.`)
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
          <button className="btn-sage text-sm" onClick={assign} disabled={saving || full || !shiftId || roleTaken}>
            <Plus className="w-4 h-4" /> {saving ? 'Asignando…' : 'Asignar'}
          </button>
        </>
      }
    >
      {full && (
        <div className="mb-4 p-3 rounded-lg bg-[rgba(199,123,92,0.10)] text-[color:var(--warn)] text-sm">
          Este día ya tiene 2 personas asignadas (máximo permitido).
        </div>
      )}

      {/* Existing — show ALL assignments for this date, not just the selected user's */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Asignaciones del día ({allForDate.length}/2)
        </p>
        {allForDate.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nadie asignado todavía.</p>
        ) : (
          <div className="space-y-2">
            {allForDate.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sage" />
                  <div>
                    <p className="text-sm font-medium">
                      {a.shift?.name} · <span className="text-muted-foreground">{a.user?.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.shift?.startTime}–{a.shift?.endTime} · <Badge variant="muted">{a.role}</Badge>
                    </p>
                  </div>
                </div>
                <button
                  className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                  onClick={() => remove(a.id)}
                  aria-label="Eliminar asignación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New assignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Turno</label>
          <select className="input-wellness" value={shiftId} onChange={(e) => setShiftId(e.target.value)} disabled={full}>
            {shifts.map((s) => {
              const count = allForDate.filter((a) => a.shiftId === s.id).length
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime}–{s.endTime}){count > 0 ? ` · ${count}/2 ocupado` : ''}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Rol</label>
          <select className="input-wellness" value={role} onChange={(e) => setRole(e.target.value)} disabled={full}>
            <option value="CAMARERO" disabled={takenRoles.has('CAMARERO')}>
              CAMARERO {takenRoles.has('CAMARERO') ? '(ya asignado)' : ''}
            </option>
            <option value="COCINERO" disabled={takenRoles.has('COCINERO')}>
              COCINERO {takenRoles.has('COCINERO') ? '(ya asignado)' : ''}
            </option>
          </select>
        </div>
      </div>
      {roleTaken && (
        <div className="mt-3 p-3 rounded-lg bg-[rgba(199,123,92,0.10)] text-[color:var(--warn)] text-sm">
          Ya hay un <strong>{role.toLowerCase()}</strong> asignado a este turno. Cada turno debe tener 1 cocinero y 1 camarero.
        </div>
      )}
    </ModalShell>
  )
}
