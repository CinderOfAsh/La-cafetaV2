'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowLeftRight,
  X,
  Check,
  AlertCircle,
  PanelRight,
  Bell,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, ModalShell, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, post } from '@/lib/api'
import { toast } from 'sonner'
import { DOW_LABELS, MONTHS_ES, todayStr, mondayFirstOffset, localDateStr } from '@/lib/format'
import type { ShiftAssignment, ShiftSwap, Shift } from '@/lib/types'

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
  const loggedUser = useAppStore((s) => s.user)!
  const [mode, setMode] = useState<ViewMode>('mes')
  const [cursor, setCursor] = useState(() => new Date())

  // --- Identity selection: user must pick themselves from a dropdown ---
  const [users, setUsers] = useState<DbUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [identityConfirmed, setIdentityConfirmed] = useState(false)

  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [loading, setLoading] = useState(true)

  // --- Swap flow state ---
  // mode: 'normal' = see all shifts, mine highlighted yellow
  //      'selecting' = mine are default, others are yellow (intercambiables)
  const [calendarMode, setCalendarMode] = useState<'normal' | 'selecting'>('normal')
  const [swapSource, setSwapSource] = useState<ShiftAssignment | null>(null) // my assignment I want to swap
  const [showSwapDialog, setShowSwapDialog] = useState(false) // controls the swap source dialog visibility
  const [targetAssignment, setTargetAssignment] = useState<ShiftAssignment | null>(null) // clicked target
  // Cuando un día tiene 2 personas en modo 'selecting', mostramos un mini-popover
  // para que el user elija A CUÁL de las dos le pide el cambio.
  const [popoverShift, setPopoverShift] = useState<ShiftAssignment[] | null>(null) // array de 2 personas del día
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)

  // --- Pending swap requests (for the replacement user) ---
  const [pendingSwaps, setPendingSwaps] = useState<ShiftSwap[]>([])
  const [activePendingSwap, setActivePendingSwap] = useState<ShiftSwap | null>(null)

  // --- Response notifications (for the original user) ---
  const [responseSwaps, setResponseSwaps] = useState<ShiftSwap[]>([])
  const [activeResponseSwap, setActiveResponseSwap] = useState<ShiftSwap | null>(null)
  // Swaps que el user recibió respuesta pero eligió "Más tarde" — los
  // guardamos aquí (sin marcar como visto) para que aparezcan en el panel lateral
  // y pueda reabrir la notificación cuando quiera.
  // Persistimos en localStorage para que sobrevivan a recargas de página.
  const [pendingResponseSwaps, setPendingResponseSwaps] = useState<ShiftSwap[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem('lacafeta:pendingResponseSwaps')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        'lacafeta:pendingResponseSwaps',
        JSON.stringify(pendingResponseSwaps)
      )
    } catch {
      // ignore
    }
  }, [pendingResponseSwaps])

  // --- Review mode (for replacement reviewing a swap) ---
  const [reviewingSwap, setReviewingSwap] = useState<ShiftSwap | null>(null)
  const [showReviewPanel, setShowReviewPanel] = useState(false)

  const user = useMemo(() => {
    if (selectedUserId) {
      const u = users.find((x) => x.id === selectedUserId)
      if (u) return { id: u.id, name: u.name, email: u.email, role: u.role as any }
    }
    return loggedUser
  }, [selectedUserId, users, loggedUser])

  // Load users for dropdown
  useEffect(() => {
    get<DbUser[]>('/api/users')
      .then((us) => {
        const employees = us.filter((u) => u.isActive && u.role !== 'ADMIN')
        setUsers(employees)
      })
      .catch(() => toast.error('No se pudieron cargar los usuarios'))
  }, [])

  // Load ALL assignments + pending swaps when identity is confirmed
  const loadData = useCallback(async () => {
    if (!identityConfirmed || !user) return
    setLoading(true)
    try {
      const [as, pending, responses] = await Promise.all([
        get<ShiftAssignment[]>(`/api/shift-assignments`),
        get<ShiftSwap[]>(`/api/shift-swaps?pendingFor=${user.id}`),
        get<ShiftSwap[]>(`/api/shift-swaps?responseFor=${user.id}`),
      ])
      setAssignments(as)
      setPendingSwaps(pending)
      setResponseSwaps(responses)
      // Show first pending swap if any
      if (pending.length > 0 && !activePendingSwap) {
        setActivePendingSwap(pending[0])
      }
      // Show first response if any (pero no mostrar los que ya están en "Más tarde")
      const unseen = responses.filter((s) => !pendingResponseSwaps.find((p) => p.id === s.id))
      if (unseen.length > 0 && !activeResponseSwap) {
        setActiveResponseSwap(unseen[0])
      }
    } catch {
      toast.error('No se pudieron cargar los turnos')
    } finally {
      setLoading(false)
    }
  }, [identityConfirmed, user])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    if (mode === 'dia') return cursor.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (mode === 'semana') {
      const start = new Date(cursor)
      const day = start.getDay()
      const offset = day === 0 ? -6 : 1 - day
      start.setDate(start.getDate() + offset)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return `${MONTHS_ES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [cursor, mode])

  const visibleAssignments = useMemo(() => {
    if (mode === 'dia') {
      const ds = localDateStr(cursor)
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
    const start = localDateStr(new Date(y, m, 1))
    const end = localDateStr(new Date(y, m + 1, 0))
    return assignments.filter((a) => a.date >= start && a.date <= end)
  }, [assignments, cursor, mode])

  const monthCells = useMemo(() => {
    if (mode !== 'mes') return []
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startOffset = mondayFirstOffset(first.getDay())
    const total = last.getDate()
    const cells: { date: string | null; day: number | null }[] = []
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null })
    for (let d = 1; d <= total; d++) {
      const date = localDateStr(new Date(y, m, d))
      cells.push({ date, day: d })
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
    return cells
  }, [cursor, mode])

  // Handle clicking a shift in the calendar
  function handleShiftClick(asg: ShiftAssignment) {
    const isMine = asg.userId === user.id

    if (calendarMode === 'normal') {
      if (isMine) {
        setSwapSource(asg)
        setShowSwapDialog(true)
      }
    } else if (calendarMode === 'selecting') {
      if (!isMine) {
        setTargetAssignment(asg)
      }
    }
  }

  // Confirm swap request
  async function confirmSwapRequest(replacementUserId: string) {
    if (!swapSource) return
    try {
      await post('/api/shift-swaps', {
        originalUserId: user.id,
        replacementUserId,
        shiftAssignmentId: swapSource.id,
        type: 'swap',
        replacementShiftAssignmentId: targetAssignment?.id || null,
      })
      toast.success('Tu solicitud de intercambio ha sido procesada, está pendiente de aprobación, paciencia manin')
      setSwapSource(null)
      setShowSwapDialog(false)
      setTargetAssignment(null)
      setCalendarMode('normal')
    } catch (e: any) {
      toast.error(e.message || 'No se pudo registrar la solicitud')
    }
  }

  // Approve swap (replacement user)
  async function approveSwap(swapId: string, replacementShiftAssignmentId?: string) {
    try {
      await post(`/api/shift-swaps/${swapId}/approve`, {
        replacementShiftAssignmentId: replacementShiftAssignmentId || targetAssignment?.id,
      })
      toast.success('Intercambio procesado')
      setActivePendingSwap(null)
      setReviewingSwap(null)
      setShowReviewPanel(false)
      setTargetAssignment(null)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'No se pudo aprobar')
    }
  }

  // Reject swap (replacement user)
  async function rejectSwap(swapId: string) {
    try {
      await post(`/api/shift-swaps/${swapId}/reject`)
      toast.info('Solicitud rechazada')
      setActivePendingSwap(null)
      setReviewingSwap(null)
      setShowReviewPanel(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'No se pudo rechazar')
    }
  }

  // Mark response as seen (original user)
  // dismiss=true  → "Entendido", sale de la lista del panel lateral Y marca como visto en BD
  // dismiss=false → "Más tarde", guarda en panel lateral local, NO marca como visto en BD
  async function markResponseSeen(swapId: string, dismiss: boolean) {
    try {
      if (dismiss) {
        // "Entendido" → marcar como visto en BD (ya no aparecerá como "pendiente")
        await post(`/api/shift-swaps/${swapId}/mark-seen`, { as: 'original' })
      }
      // En cualquier caso, quitamos del modal activo y de la lista "más tarde"
      setResponseSwaps((prev) => prev.filter((s) => s.id !== swapId))
      setPendingResponseSwaps((prev) => prev.filter((s) => s.id !== swapId))
      setActiveResponseSwap(null)
      if (!dismiss) {
        // Si NO marcó como visto, lo guardamos en panel lateral local
        // (la API lo seguirá devolviendo, pero el filtro local lo oculta del modal)
        const swap = responseSwaps.find((s) => s.id === swapId)
        if (swap) {
          setPendingResponseSwaps((prev) =>
            prev.find((s) => s.id === swapId) ? prev : [swap, ...prev]
          )
        }
      }
    } catch {
      // ignore
    }
  }

  // --- Identity selection screen ---
  if (!identityConfirmed) {
    return (
      <>
        <AppHeader title="Calendario" onBack={() => setView('hub-empleado')} />
        <main className="max-w-md mx-auto px-4 py-16">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent text-sage flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl mb-2">Identifícate</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Selecciona tu nombre para ver tus turnos y gestionar intercambios.
            </p>
            <select
              className="input-wellness mb-4"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">— Selecciona tu nombre —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button
              className="btn-sage w-full"
              disabled={!selectedUserId}
              onClick={() => {
                setIdentityConfirmed(true)
                setLoading(true)
              }}
            >
              Entrar al calendario
            </button>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <AppHeader title="Calendario" onBack={() => setView('hub-empleado')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Identity banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="sage">Conectado como: {user.name}</Badge>
            {calendarMode === 'selecting' && (
              <Badge variant="warn">Modo intercambio: clicka un turno amarillo</Badge>
            )}
          </div>
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              setIdentityConfirmed(false)
              setSelectedUserId('')
              setCalendarMode('normal')
            }}
          >
            Cambiar usuario
          </button>
        </div>

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
            <button className="btn-outline text-xs ml-2" onClick={() => setCursor(new Date())}>Hoy</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-muted-foreground">
          {calendarMode === 'normal' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-300" /> Tus turnos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-muted/60" /> Turnos de otros
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-muted/60" /> Tus turnos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-300" /> Intercambiables
              </span>
              <button
                className="btn-ghost text-xs ml-2 text-[color:var(--warn)]"
                onClick={() => {
                  setCalendarMode('normal')
                  setSwapSource(null)
                }}
              >
                <X className="w-3.5 h-3.5" /> Cancelar intercambio
              </button>
            </>
          )}
        </div>

        {loading ? (
          <Card><LoadingBlock label="Cargando calendario…" /></Card>
        ) : (
          <>
            {mode === 'mes' ? (
              <Card className="p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                  {DOW_LABELS.map((d) => (
                    <div key={d} className="text-center text-xs uppercase tracking-wide text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {monthCells.map((c, idx) => {
                    if (!c.date) return <div key={idx} className="aspect-square sm:aspect-[3/2]" />
                    const dayAssignments = visibleAssignments.filter((a) => a.date === c.date)
                    const byShift = new Map<string, ShiftAssignment[]>()
                    for (const a of dayAssignments) {
                      const arr = byShift.get(a.shiftId) || []
                      arr.push(a)
                      byShift.set(a.shiftId, arr)
                    }
                    const isToday = c.date === todayStr()
                    return (
                      <div
                        key={idx}
                        className={`aspect-square sm:aspect-[3/2] rounded-lg border p-1 sm:p-1.5 text-left flex flex-col gap-0.5 bg-card overflow-hidden ${
                          isToday ? 'border-[color:var(--sage)]' : 'border-border'
                        }`}
                      >
                        <div className="text-[10px] sm:text-xs font-medium">{c.day}</div>
                        <div className="space-y-0.5 overflow-hidden">
                          {Array.from(byShift.entries()).map(([shiftId, arr]) => {
                            const shift = arr[0]?.shift
                            const isMine = arr.some((a) => a.userId === user.id)
                            const isReviewTarget = reviewingSwap && arr.some((a) => a.id === reviewingSwap.shiftAssignmentId)
                            // Color logic:
                            // normal mode: mine = yellow, others = muted
                            // selecting mode: mine = muted, others = yellow (clickable)
                            // review mode: the swap target = red, mine = yellow, others = muted
                            const bgClass = isReviewTarget
                              ? 'bg-red-200 text-red-900 border border-red-400'
                              : calendarMode === 'normal'
                                ? isMine
                                  ? 'bg-amber-300 text-amber-900 hover:bg-amber-400 cursor-pointer'
                                  : 'bg-muted/60 text-muted-foreground cursor-default'
                                : isMine
                                  ? 'bg-muted/60 text-muted-foreground cursor-default'
                                  : 'bg-amber-300 text-amber-900 hover:bg-amber-400 cursor-pointer'
                            return (
                              <button
                                key={shiftId}
                                onClick={(e) => {
                                  const clickable = calendarMode === 'normal' ? isMine : !isMine
                                  if (!clickable) return
                                  // Modo normal con tu turno: abre dialogo de solicitud
                                  if (calendarMode === 'normal' && isMine) {
                                    handleShiftClick(arr.find((a) => a.userId === user.id) || arr[0])
                                    return
                                  }
                                  // Modo selecting: si hay 2 personas, abrimos popover
                                  // para que el user elija a cuál le pide el cambio.
                                  if (calendarMode === 'selecting' && arr.length > 1) {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setPopoverPos({ x: rect.left, y: rect.bottom + 4 })
                                    setPopoverShift(arr)
                                    return
                                  }
                                  // 1 persona (o ninguna): comportamiento normal
                                  handleShiftClick(arr[0])
                                }}
                                className={`block w-full text-left text-[10px] sm:text-xs leading-snug px-1.5 py-1 rounded ${bgClass}`}
                                title={arr.map((a) => `${a.user?.name} (${a.role})`).join(', ')}
                              >
                                <span className="font-medium">{shift?.name}:</span>{' '}
                                {arr.map((a, i) => (
                                  <span key={a.id}>
                                    {i > 0 && ', '}
                                    {a.user?.name?.split(' ')[0]}
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
                    <EmptyState icon={<CalendarIcon className="w-6 h-6" />} title="Sin turnos" description="No hay turnos asignados en este periodo." />
                  </Card>
                ) : (
                  visibleAssignments
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((a) => (
                      <ShiftCard
                        key={a.id}
                        asg={a}
                        currentUserId={user.id}
                        calendarMode={calendarMode}
                        isReviewTarget={reviewingSwap?.shiftAssignmentId === a.id}
                        onClick={() => handleShiftClick(a)}
                      />
                    ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Popover para elegir A CUÁL de las 2 personas del turno pedir el cambio */}
      {popoverShift && popoverPos && (
        <>
          {/* overlay invisible para cerrar el popover al clickar fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setPopoverShift(null); setPopoverPos(null) }}
          />
          <div
            className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[220px]"
            style={{ left: popoverPos.x, top: popoverPos.y }}
            role="menu"
          >
            <p className="text-xs text-muted-foreground px-2 py-1">
              ¿A quién le pides el cambio?
            </p>
            {popoverShift.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  handleShiftClick(a)
                  setPopoverShift(null)
                  setPopoverPos(null)
                }}
                className="block w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
              >
                <span className="font-medium">{a.user?.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">({a.role})</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Swap source dialog — "¿Intercambiar este turno?" */}
      {showSwapDialog && swapSource && (
        <ModalShell
          open
          onClose={() => { setShowSwapDialog(false); setSwapSource(null); setCalendarMode('normal') }}
          title="Intercambiar turno"
          description={`${swapSource.shift?.name} · ${new Date(swapSource.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
          size="sm"
          footer={
            <>
              <button className="btn-ghost text-sm" onClick={() => { setShowSwapDialog(false); setSwapSource(null); setCalendarMode('normal') }}>Cancelar</button>
              <button
                className="btn-sage text-sm"
                onClick={() => {
                  setShowSwapDialog(false)
                  setCalendarMode('selecting')
                  toast.info('Clicka el turno con el que quieres intercambiar')
                }}
              >
                <ArrowLeftRight className="w-4 h-4" /> Seleccionar turno
              </button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Vas a solicitar un intercambio de tu turno <strong>{swapSource.shift?.name}</strong> del{' '}
            <strong>{new Date(swapSource.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</strong>.
            Selecciona con qué turno quieres intercambiarlo.
          </p>
        </ModalShell>
      )}

      {/* Target assignment dialog — shows the two people on that shift, pick one */}
      {targetAssignment && (
        <TargetSwapDialog
          asg={targetAssignment}
          onClose={() => setTargetAssignment(null)}
          onConfirm={confirmSwapRequest}
        />
      )}

      {/* Pending swap request modal (for the replacement user) */}
      {activePendingSwap && (
        <PendingSwapModal
          swap={activePendingSwap}
          onClose={() => {
            // Mark as seen so it doesn't pop up again
            post(`/api/shift-swaps/${activePendingSwap.id}/mark-seen`, { as: 'replacement' }).catch(() => {})
            setActivePendingSwap(null)
            setPendingSwaps((prev) => prev.filter((s) => s.id !== activePendingSwap.id))
          }}
          onAccept={() => {
            // Direct accept with confirmation
            if (confirm(`¿Estás seguro de aceptar el intercambio de tu turno con ${activePendingSwap.originalUser?.name}?`)) {
              approveSwap(activePendingSwap.id, activePendingSwap.replacementShiftAssignmentId || undefined)
            }
          }}
          onReview={() => {
            setReviewingSwap(activePendingSwap)
            setShowReviewPanel(true)
            setActivePendingSwap(null)
          }}
        />
      )}

      {/* Review floating panel (when reviewing a swap) */}
      {reviewingSwap && showReviewPanel && (
        <ReviewPanel
          swap={reviewingSwap}
          onClose={() => setShowReviewPanel(false)}
          onAccept={() => {
            if (confirm(`¿Estás seguro de aceptar el intercambio con ${reviewingSwap.originalUser?.name}?`)) {
              approveSwap(reviewingSwap.id, reviewingSwap.replacementShiftAssignmentId || undefined)
            }
          }}
          onReject={() => rejectSwap(reviewingSwap.id)}
        />
      )}

      {/* Response modal (for the original user — swap was approved/rejected) */}
      {activeResponseSwap && (
        <ResponseModal
          swap={activeResponseSwap}
          onDismiss={() => markResponseSeen(activeResponseSwap.id, true)}
          onLater={() => markResponseSeen(activeResponseSwap.id, false)}
        />
      )}

      {/* Panel lateral: respuestas pendientes de ver (cuando el user le dio "Más tarde") */}
      {pendingResponseSwaps.length > 0 && (
        <aside
          className="fixed right-4 bottom-4 z-30 w-72 bg-card border-2 border-[color:var(--sage)] rounded-lg shadow-xl p-4 max-h-[60vh] overflow-y-auto"
          role="region"
          aria-label="Solicitudes de turno pendientes"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-[color:var(--sage)]" />
              Solicitudes pendientes ({pendingResponseSwaps.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingResponseSwaps.map((s) => {
              const approved = s.status === 'APPROVED'
              return (
                <div
                  key={s.id}
                  className={`p-2 rounded border text-xs ${
                    approved
                      ? 'border-sage/40 bg-[rgba(127,166,155,0.08)]'
                      : 'border-[color:var(--warn)]/40 bg-[rgba(199,123,92,0.08)]'
                  }`}
                >
                  <button
                    onClick={() => setActiveResponseSwap(s)}
                    className="w-full text-left hover:opacity-80"
                  >
                    <div className="font-medium text-foreground">
                      {s.replacementUser?.name} {approved ? 'aceptó' : 'rechazó'} tu cambio
                    </div>
                    <div className="text-muted-foreground mt-0.5 truncate">
                      {s.shiftAssignment?.shift?.name} ·{' '}
                      {s.shiftAssignment?.date &&
                        new Date(s.shiftAssignment.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                    </div>
                  </button>
                  <button
                    onClick={() => markResponseSeen(s.id, true)}
                    className="mt-1 text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Marcar como visto
                  </button>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic">
            Click en una para reabrir
          </p>
        </aside>
      )}
    </>
  )
}

// ============ Sub-components ============

function ShiftCard({
  asg,
  currentUserId,
  calendarMode,
  isReviewTarget,
  onClick,
}: {
  asg: ShiftAssignment
  currentUserId: string
  calendarMode: 'normal' | 'selecting'
  isReviewTarget: boolean
  onClick: () => void
}) {
  const isMine = asg.userId === currentUserId
  const bgClass = isReviewTarget
    ? 'border-red-400 bg-red-50'
    : calendarMode === 'normal'
      ? isMine
        ? 'border-amber-400 bg-amber-50'
        : 'border-border bg-card'
      : isMine
        ? 'border-border bg-card'
        : 'border-amber-400 bg-amber-50'

  return (
    <button
      onClick={onClick}
      disabled={calendarMode === 'normal' ? !isMine : isMine}
      className={`card-wellness p-4 text-left transition-colors ${bgClass} ${
        (calendarMode === 'normal' ? isMine : !isMine) ? 'cursor-pointer hover:shadow-md' : 'cursor-default opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-foreground">{asg.shift?.name}</p>
          <p className="text-sm text-muted-foreground">{asg.shift?.startTime}–{asg.shift?.endTime}</p>
        </div>
        {isMine ? <Badge variant="sage">Tú</Badge> : <Badge variant="muted">{asg.user?.name}</Badge>}
      </div>
      <p className="text-xs text-muted-foreground capitalize">
        {new Date(asg.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <p className="text-xs text-muted-foreground mt-1">Rol: {asg.role}</p>
    </button>
  )
}

function TargetSwapDialog({
  asg,
  onClose,
  onConfirm,
}: {
  asg: ShiftAssignment
  onClose: () => void
  onConfirm: (replacementUserId: string) => void
}) {
  return (
    <ModalShell
      open
      onClose={onClose}
      title="Selecciona compañero"
      description={`${asg.shift?.name} · ${new Date(asg.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`}
      size="sm"
    >
      <p className="text-sm text-muted-foreground mb-4">
        Este turno tiene asignadas a las siguientes personas. Selecciona con quién quieres intercambiar:
      </p>
      <div className="space-y-2">
        <button
          className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-[color:var(--sage)] hover:bg-accent transition-colors text-left"
          onClick={() => onConfirm(asg.userId)}
        >
          <div>
            <p className="font-medium">{asg.user?.name}</p>
            <p className="text-xs text-muted-foreground">Rol: {asg.role}</p>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-sage" />
        </button>
      </div>
    </ModalShell>
  )
}

function PendingSwapModal({
  swap,
  onClose,
  onAccept,
  onReview,
}: {
  swap: ShiftSwap
  onClose: () => void
  onAccept: () => void
  onReview: () => void
}) {
  const sa = swap.shiftAssignment
  return (
    <ModalShell
      open
      onClose={onClose}
      title="Solicitud de intercambio"
      description={`${swap.originalUser?.name} quiere intercambiar su turno contigo`}
      size="md"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>Más tarde</button>
          <button className="btn-outline text-sm" onClick={onReview}>
            <CalendarIcon className="w-4 h-4" /> Revisar
          </button>
          <button className="btn-sage text-sm" onClick={onAccept}>
            <Check className="w-4 h-4" /> Aceptar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-accent p-4">
          <p className="text-sm font-medium mb-2">{swap.originalUser?.name} quiere intercambiar:</p>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{sa?.shift?.name}</p>
              <p className="text-sm text-muted-foreground">
                {sa?.shift?.startTime}–{sa?.shift?.endTime} · {new Date(sa?.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Si aceptas, se procesará el intercambio inmediatamente. Si prefieres revisar tu calendario antes de decidir, usa el botón Revisar.
        </p>
      </div>
    </ModalShell>
  )
}

function ReviewPanel({
  swap,
  onClose,
  onAccept,
  onReject,
}: {
  swap: ShiftSwap
  onClose: () => void
  onAccept: () => void
  onReject: () => void
}) {
  const [open, setOpen] = useState(true)
  const sa = swap.shiftAssignment
  return (
    <>
      {/* Toggle button when closed */}
      {!open && (
        <button
          className="fixed top-20 right-4 z-40 btn-sage shadow-lg"
          onClick={() => setOpen(true)}
        >
          <PanelRight className="w-4 h-4" /> Solicitud de intercambio
        </button>
      )}
      {/* Slide-out panel */}
      {open && (
        <div className="fixed top-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
          <div className="card-wellness p-5 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-serif text-lg">Solicitud de intercambio</h3>
                <p className="text-xs text-muted-foreground">{swap.originalUser?.name} → ti</p>
              </div>
              <button className="btn-ghost p-1" onClick={() => setOpen(false)} aria-label="Cerrar panel">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-lg bg-accent p-3 mb-3">
              <p className="text-sm font-medium">{sa?.shift?.name}</p>
              <p className="text-xs text-muted-foreground">
                {sa?.shift?.startTime}–{sa?.shift?.endTime} · {new Date(sa?.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="space-y-2">
              <button
                className="btn-sage w-full text-sm"
                onClick={onAccept}
              >
                <Check className="w-4 h-4" /> Aceptar intercambio
              </button>
              <button
                className="btn-outline w-full text-sm text-[color:var(--warn)] border-[color:var(--warn)]"
                onClick={onReject}
              >
                <X className="w-4 h-4" /> Rechazar
              </button>
              <button
                className="btn-ghost w-full text-xs"
                onClick={() => setOpen(false)}
              >
                Seguir revisando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ResponseModal({
  swap,
  onDismiss,
  onLater,
}: {
  swap: ShiftSwap
  onDismiss: () => void  // "Entendido" → marca como visto y desaparece
  onLater: () => void    // "Más tarde" → guarda en panel lateral, NO marca como visto
}) {
  const approved = swap.status === 'APPROVED'
  return (
    <ModalShell
      open
      onClose={onLater}  // cerrar con X = "más tarde"
      title={approved ? '¡Intercambio aprobado!' : 'Intercambio rechazado'}
      size="sm"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onLater}>Más tarde</button>
          <button className="btn-sage text-sm" onClick={onDismiss}>Entendido</button>
        </>
      }
    >
      <div className="text-center py-4">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
          approved ? 'bg-[rgba(127,166,155,0.15)] text-sage' : 'bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)]'
        }`}>
          {approved ? <Check className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        {approved ? (
          <p className="font-serif text-xl text-sage">Enhorabuena mae, te dijeron que si</p>
        ) : (
          <p className="font-serif text-xl text-[color:var(--warn)]">
            {[
              'El diablo loco, te rechazaron la vaina',
              'La muhel mía dice que no te cambian el turno',
              'MI loco te rechazaron y el cambio de turno tambien',
              'Te han rechazado el intercambio manin mala suerte',
              'Pringao, te quedaste sin cambio de turno',
            ][Math.floor(Math.random() * 5)]}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-3">
          {swap.replacementUser?.name} {approved ? 'aceptó' : 'rechazó'} tu solicitud de intercambio del turno{' '}
          <strong>{swap.shiftAssignment?.shift?.name}</strong> del{' '}
          {new Date(swap.shiftAssignment?.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.
        </p>
      </div>
    </ModalShell>
  )
}
