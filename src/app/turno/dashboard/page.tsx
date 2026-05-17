'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Banknote, CreditCard, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { downloadCsv } from '@/lib/export-csv';

interface ShiftEntry {
  id: number;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  role: string;
  salesCount: number;
  salesTotal: number;
}

interface MyStats {
  totalAmount: number;
  totalItems: number;
  cashTotal: number;
  cardTotal: number;
  firstSale: string | null;
  lastSale: string | null;
  totalShifts: number;
  shiftHistory: ShiftEntry[];
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function TurnoDashboardPage() {
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedShift, setExpandedShift] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/my-stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  async function exportMySales() {
    const res = await fetch('/api/export/sales');
    const data = await res.json();
    downloadCsv(data, 'mis_ventas');
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-light-grey">Cargando...</div>;
  if (!stats) return <div className="flex h-64 items-center justify-center text-light-grey">No se pudieron cargar las estadísticas.</div>;

  const cashPct = stats.totalAmount > 0 ? (stats.cashTotal / stats.totalAmount) * 100 : 0;
  const cardPct = stats.totalAmount > 0 ? (stats.cardTotal / stats.totalAmount) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>Mi Rendimiento</h1>
        <button onClick={exportMySales} className="flex items-center gap-2 rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-grey hover:border-sage hover:text-sage">
          <Download className="h-4 w-4" /> Exportar mis ventas
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-wellness p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-light"><DollarSign className="h-5 w-5 text-sage" /></div>
            <span className="text-sm text-light-grey">Total vendido</span>
          </div>
          <p className="text-2xl font-bold text-dark">{fmt(stats.totalAmount)}</p>
        </div>
        <div className="card-wellness p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50"><ShoppingCart className="h-5 w-5 text-blue-500" /></div>
            <span className="text-sm text-light-grey">Productos vendidos</span>
          </div>
          <p className="text-2xl font-bold text-dark">{stats.totalItems}</p>
        </div>
        <div className="card-wellness p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50"><Banknote className="h-5 w-5 text-green-500" /></div>
            <span className="text-sm text-light-grey">Efectivo</span>
          </div>
          <p className="text-2xl font-bold text-dark">{fmt(stats.cashTotal)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark/5">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${cashPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-light-grey">{cashPct.toFixed(0)}% del total</p>
        </div>
        <div className="card-wellness p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50"><CreditCard className="h-5 w-5 text-purple-500" /></div>
            <span className="text-sm text-light-grey">Datáfono</span>
          </div>
          <p className="text-2xl font-bold text-dark">{fmt(stats.cardTotal)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark/5">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${cardPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-light-grey">{cardPct.toFixed(0)}% del total</p>
        </div>
      </div>

      {(stats.firstSale || stats.lastSale) && (
        <div className="mb-8 flex items-center gap-4 card-wellness p-4 reveal">
          <Clock className="h-5 w-5 text-light-grey" />
          <div className="flex items-center gap-2 text-sm">
            {stats.firstSale && <span className="text-light-grey">Primera venta: <span className="font-medium text-dark">{new Date(stats.firstSale).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></span>}
            {stats.firstSale && stats.lastSale && <span className="text-dark/20">|</span>}
            {stats.lastSale && <span className="text-light-grey">Última venta: <span className="font-medium text-dark">{new Date(stats.lastSale).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></span>}
          </div>
        </div>
      )}

      {stats.shiftHistory.length === 0 ? (
        <div className="card-wellness p-12 text-center reveal">
          <Clock className="mx-auto mb-3 h-12 w-12 text-dark/20" />
          <p className="text-lg font-semibold text-light-grey">Sin datos</p>
          <p className="mt-1 text-sm text-light-grey/60">Aún no tienes turnos registrados.</p>
        </div>
      ) : (
        <div className="card-wellness p-5 reveal">
          <h3 className="mb-4 font-semibold text-dark">Historial de turnos</h3>
          <div className="space-y-2">
            {stats.shiftHistory.map((s) => (
              <div key={s.id} className="overflow-hidden rounded-lg border border-dark/10">
                <button
                  onClick={() => setExpandedShift(expandedShift === s.id ? null : s.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-dark/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-sage-light px-2.5 py-1 text-xs font-semibold text-sage">{s.shiftName}</div>
                    <div>
                      <p className="font-medium text-dark">{fmtDate(s.date)}</p>
                      <p className="text-xs text-light-grey">{s.startTime} - {s.endTime} · {s.role === 'COCINERO' ? 'Cocinero' : 'Anotador'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.salesCount > 0 && (
                      <span className="text-sm text-light-grey">{s.salesCount} ventas · {fmt(s.salesTotal)}</span>
                    )}
                    {expandedShift === s.id ? <ChevronUp className="h-4 w-4 text-light-grey" /> : <ChevronDown className="h-4 w-4 text-light-grey" />}
                  </div>
                </button>
                {expandedShift === s.id && (
                  <div className="border-t border-dark/5 bg-dark/5 px-4 py-3 text-sm text-light-grey">
                    {s.salesCount === 0 ? (
                      <p>No hay ventas registradas para este turno.</p>
                    ) : (
                      <p>{s.salesCount} venta{s.salesCount > 1 ? 's' : ''} por un total de {fmt(s.salesTotal)}.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
