'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  RotateCcw,
  Handshake,
  X,
  AlertCircle,
  Download,
} from 'lucide-react';
import { downloadCsv } from '@/lib/export-csv';

interface Assignment {
  id: number;
  shiftId: number;
  userId: number;
  date: string;
  role: string;
  shift: { id: number; name: string; startTime: string; endTime: string };
  user: { id: number; name: string };
}

interface SwapData {
  type: 'swap' | 'substitute';
  assignmentId: number;
  date: string;
  shiftName: string;
  myName: string;
  myUserId: number;
  partnerId: number;
  partnerName: string;
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const hours = Array.from({ length: 24 }, (_, i) => i);

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function ds(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function weekStart(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export default function CalendarioPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [weekStartDay, setWeekStartDay] = useState(weekStart(now));
  const [selectedDay, setSelectedDay] = useState(now.toISOString().slice(0, 10));

  const [swapModal, setSwapModal] = useState<SwapData | null>(null);
  const [swapPartner, setSwapPartner] = useState('');
  const [swapWhoAmI, setSwapWhoAmI] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/shift-assignments').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
    ]).then(([me, list, u]) => {
      setMyId(me.id);
      setAllAssignments(list);
      setUsers(u.filter((x: { isActive: boolean }) => x.isActive));
      setAssignments(list.filter((a: Assignment) => a.userId === me.id));
    }).finally(() => setLoading(false));
  }, []);

  const myName = useMemo(() => users.find((u) => u.id === myId)?.name || '', [users, myId]);

  const navigate = (dir: -1 | 1) => {
    if (view === 'month') {
      if (month + dir < 0) { setMonth(11); setYear(year - 1); }
      else if (month + dir > 11) { setMonth(0); setYear(year + 1); }
      else setMonth(month + dir);
    } else if (view === 'week') {
      const ns = new Date(weekStartDay);
      ns.setDate(ns.getDate() + dir * 7);
      setWeekStartDay(ns);
    } else {
      const ns = new Date(selectedDay + 'T00:00:00');
      ns.setDate(ns.getDate() + dir);
      setSelectedDay(ns.toISOString().slice(0, 10));
    }
  };

  const goToday = () => {
    setYear(now.getFullYear()); setMonth(now.getMonth());
    setWeekStartDay(weekStart(now));
    setSelectedDay(now.toISOString().slice(0, 10));
  };

  const title = view === 'month' ? `${monthNames[month]} ${year}`
    : view === 'week' ? `Semana del ${weekStartDay.toLocaleDateString('es-MX')}`
    : new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  function getAssignmentsForDate(date: string) {
    return allAssignments.filter((a) => a.date === date);
  }

  function openSwap(a: Assignment, type: 'swap' | 'substitute') {
    setSwapWhoAmI('');
    setSwapPartner('');
    setSwapModal({ type, assignmentId: a.id, date: a.date, shiftName: a.shift.name, myName, myUserId: myId!, partnerId: 0, partnerName: '' });
  }

  async function confirmSwap() {
    if (!swapModal || !swapPartner || !swapWhoAmI) return;
    const originalUserId = parseInt(swapWhoAmI);
    const partnerId = parseInt(swapPartner);
    const body = swapModal.type === 'swap'
      ? { originalUserId, replacementUserId: partnerId, shiftAssignmentId: swapModal.assignmentId, type: 'SWAP' }
      : { originalUserId, replacementUserId: partnerId, shiftAssignmentId: swapModal.assignmentId, type: 'SUBSTITUTE' };

    const res = await fetch('/api/shift-swaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const list = await fetch('/api/shift-assignments').then((r) => r.json());
      setAllAssignments(list);
      setAssignments(list.filter((a: Assignment) => a.userId === myId));
    }
    setSwapModal(null);
  }

  async function exportCalendar() {
    const res = await fetch('/api/export/shifts');
    const data = await res.json();
    downloadCsv(data, 'calendario_turnos');
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-light-grey">Cargando...</div>;

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.03em' }}>Calendario de Turnos</h1>

        <div className="mb-6 flex flex-wrap items-center gap-3 card-wellness p-3">
          <div className="flex rounded-lg border border-dark/10 overflow-hidden">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium capitalize ${view === v ? 'bg-sage text-white' : 'text-grey hover:bg-dark/5'}`}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-dark capitalize min-w-[140px] text-center">{title}</span>
          <button onClick={() => navigate(1)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={goToday} className="ml-auto rounded-lg border border-dark/10 px-3 py-1.5 text-xs font-medium text-grey hover:bg-dark/5">Hoy</button>
          <button onClick={exportCalendar} className="flex items-center gap-1.5 rounded-lg border border-dark/10 px-3 py-1.5 text-xs font-medium text-grey hover:border-sage hover:text-sage"><Download className="h-3.5 w-3.5" /> Exportar</button>
        </div>

        {view === 'month' && (
          <div className="overflow-hidden card-wellness">
            <div className="grid grid-cols-7 border-b border-dark/10 bg-dark/5">
              {dayShort.map((d) => <div key={d} className="py-2 text-center text-xs font-medium text-light-grey">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {(() => {
                const cells: (number | null)[] = [];
                const first = getFirstDay(year, month);
                const total = getDaysInMonth(year, month);
                for (let i = 0; i < first; i++) cells.push(null);
                for (let d = 1; d <= total; d++) cells.push(d);
                while (cells.length % 7 !== 0) cells.push(null);
                return cells.map((day, idx) => {
                  if (!day) return <div key={idx} className="min-h-28 border-b border-r border-dark/5 bg-dark/5" />;
                  const date = ds(year, month, day);
                  const isToday = date === now.toISOString().slice(0, 10);
                  const dayAssignments = getAssignmentsForDate(date);
                  return (
                    <div key={idx} className={`min-h-28 border-b border-r border-dark/5 p-1.5 ${isToday ? 'bg-sage/5' : ''}`}>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? 'bg-sage text-white' : 'text-light-grey'}`}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayAssignments.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => openSwap(a, 'swap')}
                            className={`w-full truncate rounded px-1.5 py-0.5 text-[10px] text-left ${a.userId === myId ? 'bg-sage-light text-dark' : 'bg-transparent border border-dark/10 text-dark'}`}
                            title={`${a.shift.name} — ${a.user.name} (${a.role === 'COCINERO' ? 'Cocinero' : 'Anotador'})`}
                          >
                            {a.shift.name} · {a.user.name} ({a.role === 'COCINERO' ? '🧑‍🍳' : '📝'})
                          </button>
                        ))}
                        {dayAssignments.length === 0 && <p className="text-[10px] text-light-grey">—</p>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="overflow-hidden card-wellness">
            <div className="grid grid-cols-8 border-b border-dark/10 bg-dark/5">
              <div className="py-2 text-center text-xs font-medium text-light-grey">Hora</div>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStartDay);
                d.setDate(d.getDate() + i);
                const date = d.toISOString().slice(0, 10);
                const isToday = date === now.toISOString().slice(0, 10);
                return (
                  <div key={i} className={`py-2 text-center text-xs font-medium ${isToday ? 'text-sage' : 'text-light-grey'}`}>
                    {dayShort[d.getDay()]} {d.getDate()}
                  </div>
                );
              })}
            </div>
            <div className="max-h-[600px] overflow-auto">
              {hours.map((h) => (
                <div key={h} className="grid grid-cols-8 border-b border-dark/5">
                  <div className="py-2 text-center text-[10px] text-light-grey">{String(h).padStart(2, '0')}:00</div>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(weekStartDay);
                    d.setDate(d.getDate() + i);
                    const date = d.toISOString().slice(0, 10);
                    const dayAssignments = getAssignmentsForDate(date).filter((a) => {
                      const startHour = parseInt(a.shift.startTime.split(':')[0]);
                      return startHour === h;
                    });
                    return (
                      <div key={i} className="min-h-10 border-r border-dark/5 p-0.5">
                        {dayAssignments.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => openSwap(a, 'swap')}
                            className={`w-full rounded px-1 py-0.5 text-[10px] text-left ${a.userId === myId ? 'bg-sage-light text-dark' : 'bg-transparent border border-dark/10 text-dark'}`}
                          >
                            <span className="font-medium">{a.shift.name}</span>
                            <span className="block text-[9px] opacity-60">{a.user.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="overflow-hidden card-wellness">
            <div className="max-h-[600px] overflow-auto">
              {hours.map((h) => {
                const dayAssignments = getAssignmentsForDate(selectedDay).filter((a) => {
                  const startHour = parseInt(a.shift.startTime.split(':')[0]);
                  return startHour === h;
                });
                return (
                  <div key={h} className="flex border-b border-dark/5">
                    <div className="w-20 shrink-0 py-3 text-center text-xs text-light-grey">{String(h).padStart(2, '0')}:00</div>
                    <div className="flex-1 border-l border-dark/5 p-1">
                      {dayAssignments.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => openSwap(a, 'swap')}
                          className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${a.userId === myId ? 'bg-sage-light text-dark' : 'bg-blue-50 text-blue-600'}`}
                        >
                          <span className="font-medium">{a.shift.name}</span>
                          <span className="ml-2 text-xs opacity-70">{a.shift.startTime}–{a.shift.endTime}</span>
                          <span className="ml-2 text-xs opacity-70">· {a.user.name}</span>
                          <span className="ml-2 text-xs opacity-70">({a.role === 'COCINERO' ? 'Cocinero' : 'Anotador'})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSwapModal(null)}>
          <div className="w-full max-w-sm card-wellness p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">
                {swapModal.type === 'swap' ? 'Intercambiar turno' : 'Sustituir turno'}
              </h3>
              <button onClick={() => setSwapModal(null)} className="text-light-grey hover:text-dark"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4 rounded-lg bg-dark/5 p-3 text-sm">
              <p className="font-medium text-dark">{swapModal.shiftName}</p>
              <p className="text-xs text-light-grey">{swapModal.date}</p>
            </div>

            {swapModal.type === 'swap' && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-light-grey">¿Quién eres?</label>
                  <select
                    value={swapWhoAmI}
                    onChange={(e) => setSwapWhoAmI(e.target.value)}
                    className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark"
                  >
                    <option value="">Seleccionar...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-center text-light-grey">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-light-grey">¿Con quién intercambias?</label>
                  <select
                    value={swapPartner}
                    onChange={(e) => setSwapPartner(e.target.value)}
                    className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark"
                  >
                    <option value="">Seleccionar...</option>
                    {users.filter((u) => String(u.id) !== swapWhoAmI).map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {swapModal.type === 'substitute' && (
              <div className="mb-4 space-y-2">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-500">
                  <div className="mb-1 flex items-center gap-1 font-medium"><AlertCircle className="h-3.5 w-3.5" /> Se generará una deuda de turno</div>
                  El sustituto deberá recuperar este turno.
                </div>
                <select
                  value={swapPartner}
                  onChange={(e) => setSwapPartner(e.target.value)}
                  className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark"
                >
                  <option value="">Sustituto...</option>
                  {users.filter((u) => u.id !== myId).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={confirmSwap}
              disabled={!swapPartner || !swapWhoAmI}
              className="btn-sage w-full text-sm"
            >
              Confirmar intercambio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
