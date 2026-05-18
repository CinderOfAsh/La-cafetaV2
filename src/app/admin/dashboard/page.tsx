'use client';

import { useEffect, useState } from 'react';
import { Download, TrendingUp, ShoppingCart, DollarSign, Star, AlertTriangle, Users, Clock, CreditCard, Banknote, RotateCcw, AlertCircle } from 'lucide-react';
import { downloadCsv } from '@/lib/export-csv';

interface Stats {
  totalSales: number;
  totalAmount: number;
  totalProductsSold: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  topEmployees: { name: string; count: number; total: number }[];
  salesByHour: { hour: string; count: number; revenue: number }[];
  paymentMethodData: { method: string; count: number; total: number }[];
  criticalStock: { name: string; stock: number; minStock: number }[];
  swaps: { id: number; type: string; originalUser: string; replacementUser: string; shiftName: string; date: string; createdAt: string }[];
  pendingDebts: { id: number; userName: string; reason: string; createdAt: string }[];
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function maxOf<T>(arr: T[], fn: (item: T) => number) { return Math.max(...arr.map(fn), 1); }

export default function AdminDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [startDate, endDate]);

  async function exportSales() {
    const res = await fetch(`/api/export/sales?start=${startDate}&end=${endDate}`);
    const data = await res.json();
    downloadCsv(data, `ventas_${startDate}_${endDate}`);
  }

  if (loading) return <div className="flex h-96 items-center justify-center text-light-grey">Cargando...</div>;
  if (!stats) return <div className="flex h-96 items-center justify-center text-light-grey">No se pudieron cargar las estadísticas.</div>;

  const noData = stats.totalSales === 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-dark">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-light-grey">Desde</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-dark/10 bg-page px-3 py-1.5 text-sm text-dark" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-light-grey">Hasta</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-dark/10 bg-page px-3 py-1.5 text-sm text-dark" />
          </div>
          <button onClick={exportSales} className="flex items-center gap-2 rounded-lg border border-dark/10 px-3 py-1.5 text-sm text-grey hover:border-sage hover:text-sage">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {noData && (
        <div className="mb-6 rounded-xl border border-dark/10 bg-page p-8 text-center">
          <p className="text-lg font-semibold text-grey">Sin datos en este periodo</p>
          <p className="mt-1 text-sm text-light-grey">No hay ventas registradas entre {startDate} y {endDate}.</p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={DollarSign} label="Ventas totales" value={fmt(stats.totalAmount)} color="text-sage" bg="bg-sage-light" />
        <KpiCard icon={ShoppingCart} label="Transacciones" value={stats.totalSales} color="text-purple-500" bg="bg-purple-50" />
        <KpiCard icon={TrendingUp} label="Productos vendidos" value={stats.totalProductsSold} color="text-blue-500" bg="bg-blue-50" />
        <KpiCard icon={Star} label="Producto estrella" value={stats.topProducts[0]?.name || '—'} sub={stats.topProducts[0] ? `${stats.topProducts[0].qty} uds` : ''} color="text-green-500" bg="bg-green-50" />
        <KpiCard icon={AlertTriangle} label="Stock crítico" value={stats.criticalStock.length} sub={stats.criticalStock.map((c) => c.name).join(', ') || 'Ninguno'} color="text-red-500" bg="bg-red-50" />
      </div>

      {stats.topEmployees.length > 0 && (
        <div className="mb-8 rounded-xl border border-dark/10 bg-page p-5">
          <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-sage" /><h2 className="font-semibold text-dark">Top 3 empleados</h2></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.topEmployees.map((e, i) => (
              <div key={i} className="rounded-lg border border-dark/10 bg-page p-4">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-sage text-white' : i === 1 ? 'bg-light-grey text-white' : 'bg-dark/20 text-grey'}`}>{i + 1}</span>
                  <div>
                    <p className="font-medium text-dark">{e.name}</p>
                    <p className="text-xs text-light-grey">{e.count} ventas · {fmt(e.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {stats.salesByHour.length > 0 && (
          <div className="rounded-xl border border-dark/10 bg-page p-5">
            <div className="mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /><h2 className="font-semibold text-dark">Ventas por hora</h2></div>
            <div className="space-y-2">
              {stats.salesByHour.map((h) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs text-light-grey">{h.hour}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-dark/5">
                    <div className="h-5 rounded-full bg-blue-500/40 transition-all" style={{ width: `${(h.count / maxOf(stats.salesByHour, (x) => x.count)) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-light-grey">{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topProducts.length > 0 && (
          <div className="rounded-xl border border-dark/10 bg-page p-5">
            <div className="mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-green-500" /><h2 className="font-semibold text-dark">Top 10 productos</h2></div>
            <div className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-xs text-light-grey">{i + 1}</span>
                  <span className="w-28 shrink-0 truncate text-xs text-grey">{p.name}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-dark/5">
                    <div className="h-5 rounded-full bg-green-500/40 transition-all" style={{ width: `${(p.qty / maxOf(stats.topProducts, (x) => x.qty)) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-light-grey">{p.qty}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.paymentMethodData.length > 0 && (
          <div className="rounded-xl border border-dark/10 bg-page p-5">
            <div className="mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-purple-500" /><h2 className="font-semibold text-dark">Efectivo vs Datáfono</h2></div>
            <div className="space-y-4">
              {stats.paymentMethodData.map((pm) => {
                const pct = stats.totalAmount > 0 ? (pm.total / stats.totalAmount) * 100 : 0;
                return (
                  <div key={pm.method}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-grey">
                        {pm.method === 'Efectivo' ? <Banknote className="h-4 w-4 text-green-500" /> : <CreditCard className="h-4 w-4 text-blue-500" />}
                        {pm.method}
                      </span>
                      <span className="text-light-grey">{fmt(pm.total)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-dark/5">
                      <div className={`h-full rounded-full transition-all ${pm.method === 'Efectivo' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stats.topEmployees.length > 0 && (
          <div className="rounded-xl border border-dark/10 bg-page p-5">
            <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-sage" /><h2 className="font-semibold text-dark">Ventas por empleado</h2></div>
            <div className="space-y-2">
              {stats.topEmployees.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-grey">{e.name}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-dark/5">
                    <div className="h-5 rounded-full bg-sage/50 transition-all" style={{ width: `${stats.topEmployees.length > 0 ? (e.total / maxOf(stats.topEmployees, (x) => x.total)) * 100 : 0}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-light-grey">{fmt(e.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-dark/10 bg-page p-5">
          <div className="mb-4 flex items-center gap-2"><RotateCcw className="h-5 w-5 text-cyan-500" /><h2 className="font-semibold text-dark">Cambios realizados</h2></div>
          {stats.swaps.length === 0 ? (
            <p className="py-4 text-center text-sm text-light-grey">Sin cambios registrados.</p>
          ) : (
            <div className="space-y-2">
              {stats.swaps.slice(0, 10).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm">
                  <div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${s.type === 'SWAP' ? 'bg-cyan-50 text-cyan-600' : 'bg-orange-50 text-orange-600'}`}>
                      {s.type === 'SWAP' ? 'Intercambio' : 'Sustitución'}
                    </span>
                    <span className="ml-2 text-grey">{s.originalUser} → {s.replacementUser}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-light-grey">{s.shiftName}</p>
                    <p className="text-xs text-light-grey/60">{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-dark/10 bg-page p-5">
          <div className="mb-4 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /><h2 className="font-semibold text-dark">Deudas pendientes</h2></div>
          {stats.pendingDebts.length === 0 ? (
            <p className="py-4 text-center text-sm text-light-grey">Sin deudas pendientes.</p>
          ) : (
            <div className="space-y-2">
              {stats.pendingDebts.slice(0, 10).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-grey">{d.userName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-light-grey">{d.reason}</p>
                    <p className="text-xs text-light-grey/60">{new Date(d.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, bg }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; color: string; bg: string }) {
  return (
    <div className="rounded-xl border border-dark/10 bg-page p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
        <span className="text-sm text-light-grey">{label}</span>
      </div>
      <p className="text-2xl font-bold text-dark">{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-light-grey">{sub}</p>}
    </div>
  );
}
