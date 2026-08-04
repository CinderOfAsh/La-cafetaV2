'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Coins,
  ShoppingCart,
  Banknote,
  CreditCard,
  Download,
  ChevronDown,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AppHeader } from '@/components/AppHeader'
import { Card, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, fetchCsv } from '@/lib/api'
import { toast } from 'sonner'
import { eur, formatDate, daysAgo, toDateInput } from '@/lib/format'
import type { MyStats } from '@/lib/types'

export function DashboardEmpleadoView() {
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)!
  const [stats, setStats] = useState<MyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState(() => toDateInput(daysAgo(30)))
  const [end, setEnd] = useState(() => toDateInput(new Date()))

  async function load() {
    setLoading(true)
    try {
      const data = await get<MyStats>(`/api/dashboard/my-stats?startDate=${start}&endDate=${end}`)
      setStats(data)
    } catch {
      toast.error('No se pudieron cargar tus estadísticas')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [start, end])

  async function exportCsv() {
    try {
      const csv = await fetchCsv(`/api/export/sales?start=${start}&end=${end}`)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mis_ventas_${start}_a_${end}.csv`
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
    if (!stats || !stats.totalSales) return 0
    return (stats.cashTotal / stats.totalSales) * 100
  }, [stats])
  const cardPct = useMemo(() => {
    if (!stats || !stats.totalSales) return 0
    return (stats.cardTotal / stats.totalSales) * 100
  }, [stats])

  return (
    <>
      <AppHeader title="Mi Dashboard" onBack={() => setView('hub-empleado')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date filters */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">Desde</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="input-wellness w-auto"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">Hasta</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="input-wellness w-auto"
            />
          </div>
          <button className="btn-sage text-sm" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Exportar mis ventas
          </button>
        </div>

        {loading || !stats ? (
          <LoadingBlock label="Cargando estadísticas…" />
        ) : (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Kpi
                icon={<Coins className="w-5 h-5" />}
                label="Total vendido"
                value={eur(stats.totalSales)}
                color="var(--sage)"
              />
              <Kpi
                icon={<ShoppingCart className="w-5 h-5" />}
                label="Productos vendidos"
                value={String(stats.totalItems)}
                color="var(--chart-1)"
              />
              <Kpi
                icon={<Banknote className="w-5 h-5" />}
                label="Efectivo"
                value={eur(stats.cashTotal)}
                pct={cashPct}
                color="var(--sage)"
              />
              <Kpi
                icon={<CreditCard className="w-5 h-5" />}
                label="Tarjeta"
                value={eur(stats.cardTotal)}
                pct={cardPct}
                color="var(--chart-4)"
              />
            </div>

            {/* Shifts history */}
            <Card>
              <h3 className="font-serif text-lg mb-3">Historial de turnos ({stats.shifts.length})</h3>
              {stats.shifts.length === 0 ? (
                <EmptyState title="Sin turnos" description="No tienes turnos en el periodo seleccionado." />
              ) : (
                <div className="space-y-2">
                  {stats.shifts.map((s, i) => (
                    <ShiftRow key={i} shift={s} />
                  ))}
                </div>
              )}
            </Card>

            {/* Hourly sales */}
            <Card>
              <h3 className="font-serif text-lg mb-3">Ventas por hora</h3>
              {stats.hourlySales.length === 0 ? (
                <EmptyState title="Sin ventas" description="No tienes ventas en el periodo." />
              ) : (
                <div className="space-y-2">
                  {stats.hourlySales.map((h, i) => (
                    <HourRow key={i} hour={h} />
                  ))}
                </div>
              )}
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
    date: string
    shiftName: string
    startTime: string
    endTime: string
    role: string
    sales: number
    total: number
  }
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-left">
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
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="text-sm font-semibold text-sage">{eur(shift.total)}</p>
              <p className="text-xs text-muted-foreground">{shift.sales} ventas</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-12 mt-2 p-3 rounded-lg bg-muted/30 text-sm">
          <p className="text-muted-foreground">Resumen del turno:</p>
          <ul className="mt-1.5 space-y-1">
            <li>· <span className="text-foreground font-medium">{shift.sales}</span> transacciones realizadas</li>
            <li>· <span className="text-foreground font-medium">{eur(shift.total)}</span> facturados</li>
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function HourRow({
  hour,
}: {
  hour: {
    hour: string
    total: number
    cash: number
    card: number
    transactions: number
    items: { name: string; qty: number; price: number }[]
  }
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-9 rounded-md bg-card border border-border flex items-center justify-center text-xs font-semibold">
              {hour.hour}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{eur(hour.total)} totales</p>
              <p className="text-xs text-muted-foreground">
                {hour.transactions} txns · <span className="text-sage">{eur(hour.cash)} efectivo</span> ·{' '}
                <span className="text-[color:var(--chart-4)]">{eur(hour.card)} tarjeta</span>
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-[60px] mt-2 p-3 rounded-lg bg-muted/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Productos vendidos
          </p>
          <ul className="space-y-1 text-sm">
            {hour.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="truncate">
                  <span className="font-semibold text-foreground">{it.qty}×</span> {it.name}
                </span>
                <span className="text-sage">{eur(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
