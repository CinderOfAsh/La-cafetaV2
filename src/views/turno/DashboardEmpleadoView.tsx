'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Coins,
  ShoppingCart,
  Banknote,
  CreditCard,
  Download,
  Users,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Card, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, fetchCsv } from '@/lib/api'
import { toast } from 'sonner'
import { eur, formatDate } from '@/lib/format'
import type { EmployeeStats } from '@/lib/types'

interface DbUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export function DashboardEmpleadoView() {
  const setView = useAppStore((s) => s.setView)
  const [users, setUsers] = useState<DbUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Load users for dropdown
  useEffect(() => {
    get<DbUser[]>('/api/users')
      .then((us) => {
        const employees = us.filter((u) => u.isActive && u.role !== 'ADMIN')
        setUsers(employees)
        if (employees.length > 0) setSelectedUserId(employees[0].id)
      })
      .catch(() => toast.error('No se pudieron cargar los empleados'))
  }, [])

  // Load stats for selected employee
  useEffect(() => {
    if (!selectedUserId) return
    let cancelled = false
    // Use a microtask to avoid synchronous setState in effect body
    Promise.resolve().then(() => setLoading(true))
    get<EmployeeStats>(`/api/dashboard/employee-stats?userId=${selectedUserId}`)
      .then((data) => { if (!cancelled) setStats(data) })
      .catch(() => toast.error('No se pudieron cargar las estadísticas'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedUserId])

  async function exportCsv() {
    if (!stats) return
    try {
      // Export the employee's sales as CSV — fetch from /api/export/sales filtered by employeeId
      const csv = await fetchCsv(`/api/export/sales?start=2000-01-01&end=2100-12-31`)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ventas_${stats.userName.replace(/\s/g, '_')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV descargado')
    } catch {
      toast.error('No se pudo exportar')
    }
  }

  const cashPct = useMemo(() => {
    if (!stats || !stats.totalRevenue) return 0
    return (stats.cashRevenue / stats.totalRevenue) * 100
  }, [stats])
  const cardPct = useMemo(() => {
    if (!stats || !stats.totalRevenue) return 0
    return (stats.cardRevenue / stats.totalRevenue) * 100
  }, [stats])

  return (
    <>
      <AppHeader title="Dashboard" onBack={() => setView('hub-empleado')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee selector */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">Empleado</label>
            <select
              className="input-wellness w-auto min-w-[200px]"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">— Selecciona —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-sage text-sm" onClick={exportCsv} disabled={!stats}>
            <Download className="w-4 h-4" /> Exportar ventas
          </button>
        </div>

        {loading || !stats ? (
          <LoadingBlock label="Cargando estadísticas…" />
        ) : (
          <div className="space-y-6">
            {/* Employee header */}
            <Card className="border-l-4 border-l-[color:var(--sage)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent text-sage flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl">{stats.userName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalShiftsAssigned} turnos · {stats.roleCount.CAMARERO} camarero · {stats.roleCount.COCINERO} cocinero
                  </p>
                </div>
              </div>
            </Card>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Kpi
                icon={<Coins className="w-5 h-5" />}
                label="Facturación"
                value={eur(stats.totalRevenue)}
                color="var(--sage)"
              />
              <Kpi
                icon={<ShoppingCart className="w-5 h-5" />}
                label="Transacciones"
                value={String(stats.totalSales)}
                sub={`${stats.totalItems} items`}
                color="var(--chart-1)"
              />
              <Kpi
                icon={<Banknote className="w-5 h-5" />}
                label="Efectivo"
                value={eur(stats.cashRevenue)}
                pct={cashPct}
                color="var(--sage)"
              />
              <Kpi
                icon={<CreditCard className="w-5 h-5" />}
                label="Tarjeta"
                value={eur(stats.cardRevenue)}
                pct={cardPct}
                color="var(--chart-4)"
              />
            </div>

            {/* Shifts history */}
            <Card>
              <h3 className="font-serif text-lg mb-3">Historial de turnos ({stats.shiftList.length})</h3>
              {stats.shiftList.length === 0 ? (
                <EmptyState title="Sin turnos" description="No tiene turnos asignados." />
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scroll">
                  {stats.shiftList.map((s, i) => (
                    <ShiftRow key={i} shift={s} />
                  ))}
                </div>
              )}
            </Card>

            {/* Intercambios */}
            <Card>
              <h3 className="font-serif text-lg mb-3">Intercambios</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Solicitados</p>
                  <p className="text-2xl font-semibold">{stats.swapsRequested}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Recibidos</p>
                  <p className="text-2xl font-semibold">{stats.swapsReceived}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-semibold text-sage">{stats.swapsApproved}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </>
  )
}

function Kpi({
  icon,
  label,
  value,
  sub,
  pct,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  pct?: number
  color: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
        >
          {icon}
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      {pct !== undefined && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%`, background: color }}
          />
        </div>
      )}
    </Card>
  )
}

function ShiftRow({
  shift,
}: {
  shift: {
    id: string
    date: string
    shiftName: string
    startTime: string
    endTime: string
    role: string
    isPast: boolean
  }
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-card border border-border flex flex-col items-center justify-center text-xs">
          <span className="text-[10px] leading-none text-muted-foreground">
            {new Date(shift.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
          </span>
          <span className="text-sm font-semibold leading-none">
            {new Date(shift.date + 'T00:00:00').getDate()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {shift.shiftName} · {shift.startTime}–{shift.endTime}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(shift.date)} · <Badge variant="muted">{shift.role}</Badge>
          </p>
        </div>
      </div>
      <Badge variant={shift.isPast ? 'muted' : 'sage'}>
        {shift.isPast ? 'Pasado' : 'Próximo'}
      </Badge>
    </div>
  )
}

// (HourRow removed — DashboardEmpleado now uses EmployeeStats which doesn't include hourly breakdown)

