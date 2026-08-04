'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { Card, Badge, LoadingBlock, ModalShell } from '@/components/shared'
import { ProtocolChecklist } from '@/components/ProtocolChecklist'
import { useAppStore } from '@/lib/store'
import { get, post } from '@/lib/api'
import { todayStr, eur } from '@/lib/format'
import { LivePizarra } from '@/components/pos'
import { Sunrise, Sunset, Lock, CheckCircle2, LogOut, RotateCcw, TrendingUp, ShoppingCart, Banknote, CreditCard, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import type { Shift, ShiftAssignment, Protocol, SaleTransaction, ShiftSalesRanking } from '@/lib/types'

type TurnoStage = 'apertura' | 'ventas' | 'cierre' | 'resumen' | 'finalizado'

const STORAGE_KEY_PREFIX = 'lacafeta:turno:'

export function TurnoView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)!
  const [todayAssignments, setTodayAssignments] = useState<ShiftAssignment[]>([])
  const [shift, setShift] = useState<Shift | null>(null)
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<TurnoStage>('apertura')
  // Sales summary for the resumen modal
  const [shiftSales, setShiftSales] = useState<SaleTransaction[]>([])
  const [shiftRanking, setShiftRanking] = useState<ShiftSalesRanking[]>([])
  const [loadingSales, setLoadingSales] = useState(false)
  const date = todayStr()
  // Use a generic storage key (not per-user) since the panel is impersonal
  const storageKey = `${STORAGE_KEY_PREFIX}shift:${date}`

  useEffect(() => {
    ;(async () => {
      try {
        // Load ALL assignments for today (impersonal — we'll determine the active shift by time)
        const assignments = await get<ShiftAssignment[]>(
          `/api/shift-assignments?date=${date}`
        )
        setTodayAssignments(assignments)
        // Determine the active shift based on current time
        const now = new Date()
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        // Group assignments by shiftId to find which shift is active now
        const shiftMap = new Map<string, { shift: any; assignments: ShiftAssignment[] }>()
        for (const a of assignments) {
          const key = a.shiftId
          if (!shiftMap.has(key)) {
            shiftMap.set(key, { shift: a.shift, assignments: [] })
          }
          shiftMap.get(key)!.assignments.push(a)
        }
        // Find the shift whose time range includes now
        let activeShift: any = null
        for (const [, val] of shiftMap) {
          const s = val.shift
          if (!s) continue
          const [sh, sm] = s.startTime.split(':').map(Number)
          const [eh, em] = s.endTime.split(':').map(Number)
          const startMin = sh * 60 + sm
          const endMin = eh * 60 + em
          if (nowMinutes >= startMin && nowMinutes <= endMin) {
            activeShift = s
            break
          }
        }
        // If no active shift by time, pick the first one of the day (or null)
        if (!activeShift && assignments.length > 0) {
          activeShift = assignments[0].shift
        }
        setShift(activeShift)
        const prots = await get<Protocol[]>('/api/protocols')
        setProtocols(prots)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [date])

  // Restore stage from localStorage
  useEffect(() => {
    if (loading) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as { stage: TurnoStage }
        if (parsed.stage && ['apertura', 'ventas', 'cierre', 'finalizado'].includes(parsed.stage)) {
          setStage(parsed.stage)
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, loading])

  function persistStage(s: TurnoStage) {
    setStage(s)
    try {
      localStorage.setItem(storageKey, JSON.stringify({ stage: s, ts: Date.now() }))
    } catch {
      // ignore
    }
  }

  const openingSteps = useMemo(() => {
    if (!shift) return [] as string[]
    const raw = shift.openingProtocol
    if (Array.isArray(raw)) return raw as string[]
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as string[] } catch { return [] }
    }
    return [] as string[]
  }, [shift])

  const closingSteps = useMemo(() => {
    if (!shift) return [] as string[]
    const raw = shift.closingProtocol
    if (Array.isArray(raw)) return raw as string[]
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as string[] } catch { return [] }
    }
    return [] as string[]
  }, [shift])

  async function completeApertura() {
    // Optionally mark protocol completion in DB
    try {
      const aperturaProtocol = protocols.find((p) => p.type === 'APERTURA')
      if (aperturaProtocol) {
        await post(`/api/protocols/${aperturaProtocol.id}/complete`, {
          completedBy: user.id,
          date,
        })
      }
    } catch {
      // non-blocking
    }
    toast.success('Turno iniciado · ¡a vender!')
    persistStage('ventas')
  }

  async function completeCierre() {
    try {
      const cierreProtocol = protocols.find((p) => p.type === 'CIERRE')
      if (cierreProtocol) {
        await post(`/api/protocols/${cierreProtocol.id}/complete`, {
          completedBy: user.id,
          date,
        })
      }
    } catch {
      // non-blocking
    }
    // Load today's sales for the active shift AND the ranking (all employees on this shift today)
    setLoadingSales(true)
    try {
      // Load all sales today and all assignments today
      const [allSales, allAssignments] = await Promise.all([
        get<SaleTransaction[]>(`/api/sales?date=${date}`),
        get<ShiftAssignment[]>(`/api/shift-assignments?date=${date}`),
      ])
      // Filter assignments and sales for the active shift
      const shiftAssignments = allAssignments.filter((a) => a.shiftId === shift?.id)
      // Sales for this shift = sales by any of the employees on this shift today
      const shiftEmployeeIds = new Set(shiftAssignments.map((a) => a.userId))
      const sales = allSales.filter((s) => s.employeeId && shiftEmployeeIds.has(s.employeeId))
      setShiftSales(sales)
      // Ranking: each person on the shift with their sales
      const ranking = shiftAssignments.map((a) => {
        const userSales = allSales.filter((s) => s.employeeId === a.userId)
        return {
          userId: a.userId,
          userName: a.user?.name || '—',
          role: a.role,
          sales: userSales.length,
          revenue: userSales.reduce((sum, s) => sum + s.total, 0),
        }
      }).sort((a, b) => b.revenue - a.revenue)
      setShiftRanking(ranking)
    } catch {
      setShiftSales([])
      setShiftRanking([])
    } finally {
      setLoadingSales(false)
    }
    toast.success('Protocolo de cierre completado')
    persistStage('resumen')
  }

  const hasShift = !!shift
  // If no shift assigned today OR shift has no opening protocol, skip to ventas stage
  const effectiveStage = (stage === 'apertura' && (!hasShift || openingSteps.length === 0)) ? 'ventas' : stage
  const hasOpeningProtocol = hasShift && openingSteps.length > 0
  const hasClosingProtocol = hasShift && closingSteps.length > 0

  // Determine which overlay to show
  const showAperturaOverlay = hasOpeningProtocol && effectiveStage === 'apertura'
  const showCierreOverlay = hasClosingProtocol && effectiveStage === 'cierre'
  const showResumen = effectiveStage === 'resumen'
  const showFinalizado = effectiveStage === 'finalizado'

  // Compute sales summary for the resumen modal
  const salesSummary = useMemo(() => {
    const totalVentas = shiftSales.length
    const ingresos = shiftSales.reduce((s, x) => s + x.total, 0)
    const efectivo = shiftSales.filter((s) => s.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0)
    const tarjeta = shiftSales.filter((s) => s.paymentMethod === 'card').reduce((s, x) => s + x.total, 0)
    const itemsVendidos = shiftSales.reduce((s, x) => s + (x.items?.reduce((acc, it) => acc + it.quantity, 0) || 0), 0)
    // Top product
    const prodAgg = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const s of shiftSales) {
      for (const it of (s.items || [])) {
        const key = it.productId || it.productName
        const prev = prodAgg.get(key) || { name: it.productName, qty: 0, revenue: 0 }
        prev.qty += it.quantity
        prev.revenue += it.price * it.quantity
        prodAgg.set(key, prev)
      }
    }
    const topProducts = Array.from(prodAgg.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)
    return { totalVentas, ingresos, efectivo, tarjeta, itemsVendidos, topProducts }
  }, [shiftSales])

  // People assigned to the active shift today
  const shiftPeople = useMemo(() => {
    if (!shift) return []
    return todayAssignments.filter((a) => a.shiftId === shift.id)
  }, [todayAssignments, shift])

  // Welcome names: the 2 people on the shift, or "Admin" if nobody
  const welcomeNames = useMemo(() => {
    if (shiftPeople.length === 0) return 'Admin'
    return shiftPeople.map((a) => a.user?.name || '—').join(' y ')
  }, [shiftPeople])

  return (
    <>
      <AppHeader title="Mi Turno" onBack={() => setView('hub-empleado')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Card><LoadingBlock label="Cargando turno…" /></Card>
        ) : hasShift ? (
          <div className="card-wellness p-5 mb-6 border-l-4 border-l-[color:var(--sage)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-sage font-semibold mb-1">
                  {showFinalizado ? 'Turno finalizado' : effectiveStage === 'ventas' ? 'Turno en curso' : 'Turno pendiente de apertura'}
                </p>
                <h2 className="font-serif text-2xl text-foreground">
                  Bienvenido, {welcomeNames}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {shift.name} · {shift.startTime}–{shift.endTime}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {shiftPeople.map((a) => (
                  <Badge key={a.id} variant={a.role === 'COCINERO' ? 'sage' : 'muted'}>
                    {a.user?.name} · {a.role}
                  </Badge>
                ))}
                {effectiveStage === 'ventas' && (
                  <button
                    className="btn-outline text-sm"
                    onClick={() => {
                      // If there's a closing protocol, go through it; otherwise go straight to resumen
                      if (hasClosingProtocol) {
                        persistStage('cierre')
                      } else {
                        completeCierre()
                      }
                    }}
                  >
                    <Sunset className="w-4 h-4" /> Finalizar turno
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-wellness p-5 mb-6 bg-muted/40">
            <p className="text-sm text-muted-foreground">
              No tienes turno asignado hoy. Puedes realizar ventas de todas formas.
            </p>
          </div>
        )}

        {/* Finalizado screen */}
        {showFinalizado ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl mb-2">Turno finalizado</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Has completado todos los protocolos de cierre. El turno de hoy queda registrado.
              Si necesitas hacer una venta adicional, puedes reabrir el turno.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                className="btn-outline"
                onClick={() => {
                  toast.info('Turno reabierto · puedes hacer ventas adicionales')
                  persistStage('ventas')
                }}
              >
                <RotateCcw className="w-4 h-4" /> Reabrir turno
              </button>
              <button className="btn-sage" onClick={() => setView('hub-empleado')}>
                <LogOut className="w-4 h-4" /> Volver al hub
              </button>
            </div>
          </Card>
        ) : showAperturaOverlay ? (
          <>
            {/* Blocker card explaining why POS is hidden */}
            <Card className="mb-6 border-l-4 border-l-[color:var(--warn)]">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[color:var(--warn)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Panel de ventas bloqueado</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Completa el protocolo de apertura para desbloquear el punto de venta.
                  </p>
                </div>
              </div>
            </Card>
            <ProtocolChecklist
              type="apertura"
              steps={openingSteps}
              onComplete={completeApertura}
              forceOpen
            />
          </>
        ) : showCierreOverlay ? (
          <ProtocolChecklist
            type="cierre"
            steps={closingSteps}
            onComplete={completeCierre}
            onCancel={() => persistStage('ventas')}
            forceOpen={false}
          />
        ) : showResumen ? (
          <ShiftSummaryModal
            summary={salesSummary}
            ranking={shiftRanking}
            currentUserId={shiftPeople[0]?.userId || user.id}
            loading={loadingSales}
            shiftName={shift?.name || ''}
            onContinue={() => persistStage('finalizado')}
            onReabrir={() => persistStage('ventas')}
          />
        ) : (
          <>
            {/* POS panel */}
            <LivePizarra employeeId={shiftPeople[0]?.userId || user.id} />
            {/* sr-only summary to keep protocols import meaningful */}
            <span className="sr-only">{protocols.length} protocolos cargados</span>
          </>
        )}

        {/* Static protocol reference (only when not in overlay) */}
        {!showAperturaOverlay && !showCierreOverlay && !showFinalizado && (openingSteps.length > 0 || closingSteps.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
            {openingSteps.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
                    <Sunrise className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg">Protocolo de apertura</h3>
                  {effectiveStage !== 'apertura' && (
                    <Badge variant="sage" className="ml-auto">completado</Badge>
                  )}
                </div>
                <ol className="space-y-2.5">
                  {openingSteps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[color:var(--sage)] text-[color:var(--sage-foreground)] inline-flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{s}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
            {closingSteps.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)] flex items-center justify-center">
                    <Sunset className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg">Protocolo de cierre</h3>
                </div>
                <ol className="space-y-2.5">
                  {closingSteps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[color:var(--warn)] text-white inline-flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{s}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        )}
      </main>
    </>
  )
}

// ---------- Shift Summary Modal ----------

function ShiftSummaryModal({
  summary,
  ranking,
  currentUserId,
  loading,
  shiftName,
  onContinue,
  onReabrir,
}: {
  summary: {
    totalVentas: number
    ingresos: number
    efectivo: number
    tarjeta: number
    itemsVendidos: number
    topProducts: { name: string; qty: number; revenue: number }[]
  }
  ranking: ShiftSalesRanking[]
  currentUserId: string
  loading: boolean
  shiftName: string
  onContinue: () => void
  onReabrir: () => void
}) {
  return (
    <ModalShell
      open
      onClose={onContinue}
      title={`Resumen del turno ${shiftName}`}
      description="Estas son tus ventas de hoy antes de cerrar el turno."
      size="md"
      footer={
        <>
          <button className="btn-outline text-sm" onClick={onReabrir}>
            <RotateCcw className="w-4 h-4" /> Reabrir turno
          </button>
          <button className="btn-sage text-sm" onClick={onContinue}>
            <CheckCircle2 className="w-4 h-4" /> Finalizar turno
          </button>
        </>
      }
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Cargando ventas…</div>
      ) : (
        <div className="space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-accent p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Ventas</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{summary.totalVentas}</p>
              <p className="text-xs text-muted-foreground">{summary.itemsVendidos} items vendidos</p>
            </div>
            <div className="rounded-lg bg-accent p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Ingresos</span>
              </div>
              <p className="text-2xl font-semibold text-sage">{eur(summary.ingresos)}</p>
              <p className="text-xs text-muted-foreground">total del turno</p>
            </div>
          </div>

          {/* Payment methods */}
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Métodos de pago</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{eur(summary.efectivo)}</p>
                  <p className="text-xs text-muted-foreground">Efectivo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{eur(summary.tarjeta)}</p>
                  <p className="text-xs text-muted-foreground">Tarjeta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top products */}
          {summary.topProducts.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Productos más vendidos
              </p>
              <ul className="space-y-2">
                {summary.topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      <span className="text-muted-foreground mr-2">#{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      <span className="font-medium text-foreground">{p.qty}ud</span> · {eur(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.totalVentas === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No has registrado ventas durante este turno.
            </div>
          )}

          {/* Ranking de ventas del turno */}
          {ranking.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Ranking de ventas del turno
              </p>
              <ul className="space-y-2">
                {ranking.map((r, i) => (
                  <li
                    key={r.userId}
                    className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                      r.userId === currentUserId ? 'bg-[rgba(127,166,155,0.15)] border border-[color:var(--sage)]' : 'bg-muted/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium w-6">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <span className="font-medium">
                        {r.userName}
                        {r.userId === currentUserId && <span className="text-sage ml-1">(tú)</span>}
                      </span>
                      <Badge variant={r.role === 'COCINERO' ? 'sage' : 'muted'}>{r.role}</Badge>
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{r.sales}</span> ventas ·{' '}
                      <span className="text-sage font-semibold">{eur(r.revenue)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  )
}
