'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Coins,
  ShoppingCart,
  TrendingUp,
  Star,
  AlertTriangle,
  Download,
  ArrowRight,
  Banknote,
  CreditCard,
  RefreshCcw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AppHeader } from '@/components/AppHeader'
import { Card, Badge, LoadingBlock } from '@/components/shared'
import { EmptyState } from '@/components/ui-bits'
import { useAppStore } from '@/lib/store'
import { get, fetchCsv } from '@/lib/api'
import { toast } from 'sonner'
import { eur, formatDate, daysAgo, toDateInput } from '@/lib/format'
import type { DashboardStats } from '@/lib/types'

const MEDALS = ['🥇', '🥈', '🥉']

export function DashboardView() {
  const setView = useAppStore((s) => s.setView)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState(() => toDateInput(daysAgo(30)))
  const [end, setEnd] = useState(() => toDateInput(new Date()))

  async function load() {
    setLoading(true)
    try {
      const data = await get<DashboardStats>(
        `/api/dashboard/stats?startDate=${start}&endDate=${end}`
      )
      setStats(data)
    } catch {
      toast.error('No se pudieron cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [start, end])

  const hourlyData = useMemo(() => {
    if (!stats) return []
    return stats.hourlySales.filter((h) => h.total > 0)
  }, [stats])

  async function exportCsv() {
    try {
      const csv = await fetchCsv(`/api/export/sales?start=${start}&end=${end}`)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ventas_${start}_a_${end}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV descargado')
    } catch {
      toast.error('No se pudo exportar')
    }
  }

  return (
    <>
      <AppHeader title="Dashboard" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
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
          <button className="btn-outline text-sm" onClick={load}>
            <RefreshCcw className="w-4 h-4" /> Actualizar
          </button>
          <button className="btn-sage text-sm" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        {loading || !stats ? (
          <LoadingBlock label="Cargando estadísticas…" />
        ) : (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <KpiCard
                icon={<Coins className="w-5 h-5" />}
                label="Ventas totales"
                value={eur(stats.totalSales)}
                color="sage"
              />
              <KpiCard
                icon={<ShoppingCart className="w-5 h-5" />}
                label="Transacciones"
                value={String(stats.totalTransactions)}
                color="purple"
              />
              <KpiCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Productos vendidos"
                value={String(stats.totalProductsSold)}
                color="blue"
              />
              <KpiCard
                icon={<Star className="w-5 h-5" />}
                label="Producto estrella"
                value={stats.starProduct?.name || '—'}
                sub={stats.starProduct ? `${stats.starProduct.quantity} ud.` : ''}
                color="sage"
              />
              <KpiCard
                icon={<AlertTriangle className="w-5 h-5" />}
                label="Stock crítico"
                value={String(stats.criticalStock.length)}
                color="warn"
              />
            </div>

            {/* Top employees + payment methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <h3 className="font-serif text-lg mb-3">Top empleados</h3>
                {stats.topEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos.</p>
                ) : (
                  <ol className="space-y-2">
                    {stats.topEmployees.map((e, i) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{MEDALS[i] || '·'}</span>
                          <div>
                            <p className="text-sm font-medium">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{e.sales} ventas</p>
                          </div>
                        </div>
                        <span className="text-sage font-semibold">{eur(e.total)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              <Card className="lg:col-span-2">
                <h3 className="font-serif text-lg mb-3">Métodos de pago</h3>
                <div className="space-y-4">
                  <PaymentBar
                    icon={<Banknote className="w-4 h-4" />}
                    label="Efectivo"
                    amount={stats.paymentMethods.cash}
                    pct={stats.paymentMethods.cashPct}
                    color="var(--sage)"
                  />
                  <PaymentBar
                    icon={<CreditCard className="w-4 h-4" />}
                    label="Tarjeta"
                    amount={stats.paymentMethods.card}
                    pct={stats.paymentMethods.cardPct}
                    color="var(--chart-3)"
                  />
                </div>
              </Card>
            </div>

            {/* Hourly sales chart */}
            <Card>
              <h3 className="font-serif text-lg mb-4">Ventas por hora</h3>
              {hourlyData.length === 0 ? (
                <EmptyState title="Sin ventas en el periodo" />
              ) : (
                <div style={{ width: '100%', height: Math.max(200, hourlyData.length * 30) }}>
                  <ResponsiveContainer>
                    <BarChart data={hourlyData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                      <XAxis type="number" tickFormatter={(v) => eur(v)} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="hour"
                        tick={{ fontSize: 11 }}
                        width={50}
                      />
                      <Tooltip
                        formatter={(v: number, n: string) => [eur(v), n === 'cash' ? 'Efectivo' : n === 'card' ? 'Tarjeta' : n]}
                        contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
                      />
                      <Bar dataKey="cash" stackId="t" fill="var(--sage)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="card" stackId="t" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="total" fill="transparent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--sage)' }} /> Efectivo
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--chart-3)' }} /> Tarjeta
                </span>
              </div>
            </Card>

            {/* Top products + critical stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <h3 className="font-serif text-lg mb-3">Productos más vendidos</h3>
                {stats.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos.</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.topProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-muted-foreground text-xs">{p.quantity} ud.</span>{' '}
                          <span className="text-sage font-semibold">{eur(p.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="font-serif text-lg mb-3">Stock crítico</h3>
                {stats.criticalStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay productos con stock bajo el mínimo.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {stats.criticalStock.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                        <span className="font-medium">{s.name}</span>
                        <Badge variant="warn">
                          <AlertTriangle className="w-3 h-3" /> {s.stock}/{s.minStock} {s.unit}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* Swaps + suministros (compras) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <h3 className="font-serif text-lg mb-3">Cambios de turno ({stats.swaps.length})</h3>
                {stats.swaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay cambios en el periodo.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.swaps.map((s) => (
                      <li key={s.id} className="text-sm flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                        <span className="truncate">
                          <span className="font-medium">{(s as any).originalUser?.name || '—'}</span>
                          <ArrowRight className="inline w-3 h-3 mx-1 text-muted-foreground" />
                          <span className="font-medium">{(s as any).replacementUser?.name || '—'}</span>
                        </span>
                        <Badge variant="muted">{s.type}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-serif text-lg">Compras de suministros</h3>
                  <span className="text-sm text-muted-foreground">
                    {stats.purchasesCount} {stats.purchasesCount === 1 ? 'compra' : 'compras'} ·{' '}
                    <span className="text-[color:var(--warn)] font-semibold">{eur(stats.totalPurchases)}</span>
                  </span>
                </div>
                {stats.recentPurchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay compras en el periodo.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.recentPurchases.map((p) => (
                      <li key={p.id} className="text-sm flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {p.supplier || 'Sin proveedor'} · {p.itemCount} {p.itemCount === 1 ? 'item' : 'items'}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                        </div>
                        <span className="text-sm font-semibold text-[color:var(--warn)] shrink-0">
                          {eur(p.totalAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: 'sage' | 'warn' | 'purple' | 'blue'
}) {
  const colorMap: Record<string, string> = {
    sage: 'var(--sage)',
    warn: 'var(--warn)',
    purple: 'var(--chart-4)',
    blue: 'var(--chart-1)',
  }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${colorMap[color]} 18%, transparent)`, color: colorMap[color] }}
        >
          {icon}
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-foreground truncate">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  )
}

function PaymentBar({
  icon,
  label,
  amount,
  pct,
  color,
}: {
  icon: React.ReactNode
  label: string
  amount: number
  pct: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          {icon} {label}
        </span>
        <span className="text-sm">
          <span className="font-semibold text-foreground">{eur(amount)}</span>{' '}
          <span className="text-muted-foreground text-xs">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, pct)}%`, background: color }}
        />
      </div>
    </div>
  )
}
