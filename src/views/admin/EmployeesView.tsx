'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShoppingCart,
  Banknote,
  CreditCard,
  Users,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get } from '@/lib/api'
import { toast } from 'sonner'
import { eur, formatDate } from '@/lib/format'
import type { EmployeeStats } from '@/lib/types'

export function EmployeesView() {
  const setView = useAppStore((s) => s.setView)
  const [stats, setStats] = useState<EmployeeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      const data = await get<EmployeeStats[]>('/api/dashboard/employee-stats')
      setStats(data)
      if (data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].userId)
      }
    } catch {
      toast.error('No se pudieron cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // Sort employees by revenue desc for the ranking overview
  const ranking = useMemo(() => {
    return [...stats].sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [stats])

  const selected = useMemo(() => {
    return stats.find((s) => s.userId === selectedUserId) || null
  }, [stats, selectedUserId])

  if (loading) {
    return (
      <>
        <AppHeader title="Empleados" onBack={() => setView('hub-admin')} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card><LoadingBlock label="Cargando estadísticas…" /></Card>
        </main>
      </>
    )
  }

  if (stats.length === 0) {
    return (
      <>
        <AppHeader title="Empleados" onBack={() => setView('hub-admin')} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Sin empleados"
              description="No hay empleados activos para mostrar estadísticas."
            />
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <AppHeader title="Empleados" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title text-2xl sm:text-3xl mb-6">Estadísticas por empleado</h1>

        {/* Ranking overview */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-sage" />
            <h3 className="font-serif text-lg">Ranking de ventas (facturación)</h3>
          </div>
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-3 py-2">#</th>
                  <th className="text-left font-medium px-3 py-2">Empleado</th>
                  <th className="text-right font-medium px-3 py-2">Ventas</th>
                  <th className="text-right font-medium px-3 py-2">Items</th>
                  <th className="text-right font-medium px-3 py-2">Facturación</th>
                  <th className="text-right font-medium px-3 py-2">Turnos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ranking.map((s, i) => (
                  <tr
                    key={s.userId}
                    className={`hover:bg-accent/40 cursor-pointer transition-colors ${
                      selectedUserId === s.userId ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedUserId(s.userId)}
                  >
                    <td className="px-3 py-2 font-medium">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium">{s.userName}</td>
                    <td className="px-3 py-2 text-right">{s.totalSales}</td>
                    <td className="px-3 py-2 text-right">{s.totalItems}</td>
                    <td className="px-3 py-2 text-right text-sage font-semibold">{eur(s.totalRevenue)}</td>
                    <td className="px-3 py-2 text-right">{s.totalShiftsAssigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Employee selector */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Selecciona un empleado para ver el detalle:</label>
          <select
            className="input-wellness max-w-xs"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {stats.map((s) => (
              <option key={s.userId} value={s.userId}>{s.userName}</option>
            ))}
          </select>
        </div>

        {/* Employee detail */}
        {selected && <EmployeeDetail stats={selected} />}
      </main>
    </>
  )
}

function EmployeeDetail({ stats: s }: { stats: EmployeeStats }) {
  const [showShifts, setShowShifts] = useState(false)
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-[color:var(--sage)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent text-sage flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-2xl">{s.userName}</h2>
            <p className="text-sm text-muted-foreground">{s.userEmail} · Rol: {s.userRole}</p>
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<CalendarDays className="w-4 h-4" />} label="Turnos totales" value={String(s.totalShiftsAssigned)} sub={`${s.upcomingShifts} próximos · ${s.pastShifts} pasados`} />
        <KpiCard icon={<ArrowLeftRight className="w-4 h-4" />} label="Intercambios solicitados" value={String(s.swapsRequested)} sub="enviados" />
        <KpiCard icon={<TrendingUp className="w-4 h-4" />} label="Ventas" value={String(s.totalSales)} sub={`${s.totalItems} items`} />
        <KpiCard icon={<Banknote className="w-4 h-4" />} label="Facturación" value={eur(s.totalRevenue)} sub={`${eur(s.cashRevenue)} efectivo · ${eur(s.cardRevenue)} tarjeta`} />
      </div>

      {/* Roles + intercambios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-serif text-lg mb-3">Distribución de roles</h3>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard role="CAMARERO" count={s.roleCount.CAMARERO} total={s.totalShiftsAssigned} />
            <RoleCard role="COCINERO" count={s.roleCount.COCINERO} total={s.totalShiftsAssigned} />
          </div>
        </Card>
        <Card>
          <h3 className="font-serif text-lg mb-3">Intercambios recibidos</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage" />
                <span className="text-sm">Aprobados</span>
              </div>
              <span className="font-semibold text-sage">{s.swapsApproved}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[color:var(--warn)]" />
                <span className="text-sm">Rechazados</span>
              </div>
              <span className="font-semibold text-[color:var(--warn)]">{s.swapsRejected}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Total recibidos</span>
              </div>
              <span className="font-semibold">{s.swapsReceived}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Ventas detail */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-5 h-5 text-sage" />
          <h3 className="font-serif text-lg">Ventas registradas</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Transacciones" value={String(s.totalSales)} />
          <StatBox label="Items vendidos" value={String(s.totalItems)} />
          <StatBox label="Efectivo" value={eur(s.cashRevenue)} icon={<Banknote className="w-3.5 h-3.5" />} />
          <StatBox label="Tarjeta" value={eur(s.cardRevenue)} icon={<CreditCard className="w-3.5 h-3.5" />} />
        </div>
      </Card>

      {/* Shifts list */}
      <Card>
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowShifts(!showShifts)}
        >
          <h3 className="font-serif text-lg">Historial de turnos ({s.shiftList.length})</h3>
          {showShifts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showShifts && (
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto custom-scroll">
            {s.shiftList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tiene turnos asignados.</p>
            ) : (
              s.shiftList.map((sh) => (
                <div
                  key={sh.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    sh.isPast ? 'bg-muted/30 opacity-70' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-sage" />
                    <div>
                      <p className="font-medium">{sh.shiftName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sh.date)} · {sh.startTime}–{sh.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sh.role === 'COCINERO' ? 'sage' : 'muted'}>{sh.role}</Badge>
                    <Badge variant={sh.isPast ? 'muted' : 'sage'}>
                      {sh.isPast ? 'Pasado' : 'Próximo'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-accent p-4 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function RoleCard({ role, count, total }: { role: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{role}</p>
      <p className="text-2xl font-semibold">{count}</p>
      <p className="text-xs text-muted-foreground">{pct}% del total</p>
      <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
        <div className="h-full bg-[color:var(--sage)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
