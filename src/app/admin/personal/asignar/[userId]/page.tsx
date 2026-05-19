'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Save,
  ArrowLeft,
  Trash2,
  Pencil,
} from 'lucide-react';

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
}

interface ExistingAssignment {
  id: number;
  shiftId: number;
  date: string;
  role: string;
  shift: { name: string; startTime: string; endTime: string };
}

interface AllAssignment {
  id: number;
  shiftId: number;
  date: string;
  userId: number;
}

interface PendingChange {
  action: 'create' | 'delete';
  id?: number;
  shiftId?: number;
  role?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success';
}

let toastIdCounter = 0;

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AsignarTurnosPage() {
  const { userId } = useParams() as { userId: string };
  const router = useRouter();

  const [employee, setEmployee] = useState<{ id: number; name: string } | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<ExistingAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<AllAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const [pending, setPending] = useState<Record<string, PendingChange>>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editShiftId, setEditShiftId] = useState('');
  const [editRole, setEditRole] = useState('ANOTADOR');

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${userId}`).then((r) => r.json()),
      fetch('/api/shifts').then((r) => r.json()),
    ]).then(([emp, s]) => {
      setEmployee(emp);
      setShifts(s);

      const start = dateStr(year, month, 1);
      const lastDay = getDaysInMonth(year, month);
      const end = dateStr(year, month, lastDay);

      return Promise.all([
        fetch(`/api/shift-assignments?userId=${userId}&startDate=${start}&endDate=${end}`).then((r) => r.json()),
        fetch(`/api/shift-assignments?startDate=${start}&endDate=${end}`).then((r) => r.json()),
      ]).then(([userList, allList]) => {
        setExistingAssignments(userList);
        setAllAssignments(allList);
      });
    }).finally(() => setLoading(false));
  }, [userId, year, month]);

  function getShiftsForDay(dayOfWeek: number): Shift[] {
    return shifts.filter((s) => s.daysOfWeek.split(',').includes(String(dayOfWeek)));
  }

  function getAssignmentForDate(date: string): ExistingAssignment | undefined {
    const pendingForDate = pending[date];
    if (pendingForDate?.action === 'delete') return undefined;
    if (pendingForDate?.action === 'create') {
      const shift = shifts.find((s) => s.id === pendingForDate.shiftId);
      if (shift) {
        return {
          id: -1,
          shiftId: shift.id,
          date,
          role: pendingForDate.role || 'ANOTADOR',
          shift: { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
        };
      }
    }
    const existing = existingAssignments.find((a) => a.date === date);
    if (existing && pending[existing.date]?.action !== 'delete') return existing;
    return undefined;
  }

  function getOccupancyForShift(shiftId: number, date: string): number {
    return allAssignments.filter((a) => a.shiftId === shiftId && a.date === date).length;
  }

  function showToast(message: string, type: 'error' | 'success') {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function startEdit(date: string, existing?: ExistingAssignment) {
    setEditingDay(date);
    if (existing) {
      setEditShiftId(String(existing.shiftId));
      setEditRole(existing.role);
    } else {
      setEditShiftId('');
      setEditRole('ANOTADOR');
    }
  }

  function saveEdit(date: string) {
    if (!editShiftId) return;
    const existing = existingAssignments.find((a) => a.date === date);

    if (existing) {
      if (existing.shiftId === parseInt(editShiftId) && existing.role === editRole) {
        setEditingDay(null);
        return;
      }
      setPending((prev) => ({
        ...prev,
        [date]: { action: 'create', id: existing.id, shiftId: parseInt(editShiftId), role: editRole },
      }));
    } else {
      setPending((prev) => ({
        ...prev,
        [date]: { action: 'create', shiftId: parseInt(editShiftId), role: editRole },
      }));
    }
    setEditingDay(null);
  }

  function removeAssignment(date: string) {
    const existing = existingAssignments.find((a) => a.date === date);
    if (existing) {
      const pendingForDate = pending[date];
      if (pendingForDate?.action === 'create' && !pendingForDate.id) {
        setPending((prev) => {
          const next = { ...prev };
          delete next[date];
          return next;
        });
      } else {
        setPending((prev) => ({
          ...prev,
          [date]: { action: 'delete', id: existing.id },
        }));
      }
    }
    setEditingDay(null);
  }

  async function saveAll() {
    const changes = Object.entries(pending).map(([date, p]) => ({
      ...p,
      date,
      userId: parseInt(userId),
    }));

    const res = await fetch('/api/shift-assignments/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: changes }),
    });

    if (res.ok) {
      setPending({});
      const start = dateStr(year, month, 1);
      const lastDay = getDaysInMonth(year, month);
      const end = dateStr(year, month, lastDay);
      const [userList, allList] = await Promise.all([
        fetch(`/api/shift-assignments?userId=${userId}&startDate=${start}&endDate=${end}`).then((r) => r.json()),
        fetch(`/api/shift-assignments?startDate=${start}&endDate=${end}`).then((r) => r.json()),
      ]);
      setExistingAssignments(userList);
      setAllAssignments(allList);
      showToast('Cambios guardados correctamente', 'success');
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'Error al guardar los cambios', 'error');
    }
  }

  const pendingCount = Object.keys(pending).length;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-light-grey">Cargando...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-53px)] flex-col bg-page">
      <header className="flex items-center gap-4 border-b border-sage/20 px-6 py-3">
        <button
          onClick={() => router.push('/admin/personal')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-light-grey hover:bg-sage-light hover:text-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <h1 className="text-lg font-bold text-dark">
          Asignar turnos — {employee?.name}
        </h1>
      </header>

      <div className="flex-1 overflow-auto p-4 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={prevMonth} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-light-grey hover:bg-sage-light hover:text-dark">
              <ChevronLeft className="h-4 w-4" /> {monthNames[(month + 11) % 12]}
            </button>
            <h2 className="text-xl font-bold text-dark">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-light-grey hover:bg-sage-light hover:text-dark">
              {monthNames[(month + 1) % 12]} <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden card-wellness">
            <div className="grid grid-cols-7 border-b border-dark/10 bg-dark/5">
              {dayHeaders.map((dh) => (
                <div key={dh} className="py-2 text-center text-xs font-medium text-light-grey">{dh}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map((day, idx) => {
                if (!day) return <div key={idx} className="min-h-24 border-b border-r border-dark/5 bg-dark/5" />;

                const d = dateStr(year, month, day);
                const dow = new Date(year, month, day).getDay();
                const isToday = d === todayStr;
                const availableShifts = getShiftsForDay(dow);
                const assignment = getAssignmentForDate(d);
                const isEditing = editingDay === d;
                const hasPending = pending[d] !== undefined;

                return (
                  <div
                    key={idx}
                    className={`relative min-h-24 border-b border-r border-dark/5 p-1.5 transition-colors ${
                      isToday ? 'bg-sage/5' : hasPending ? 'bg-blue-50' : 'bg-page'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday ? 'bg-sage text-white' : 'text-light-grey'
                      }`}>
                        {day}
                      </span>
                      {hasPending && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>

                    {!isEditing && (
                      <div className="mb-1 space-y-0.5">
                        {availableShifts.map((s) => {
                          const occ = getOccupancyForShift(s.id, d);
                          const isAssigned = assignment?.shiftId === s.id;
                          const color = occ === 0 ? 'bg-green-500/20 text-green-700 border-green-500/30' : occ === 1 ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30';
                          const dot = occ === 0 ? 'bg-green-500' : occ === 1 ? 'bg-yellow-500' : 'bg-red-500';
                          return (
                            <div key={s.id} className={`flex items-center gap-1 rounded border px-1 py-0.5 text-[9px] ${isAssigned ? 'ring-1 ring-sage' : ''} ${color}`}>
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                              <span className="truncate font-medium">{s.name}</span>
                              <span className="ml-auto opacity-70">{occ}/2</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isEditing ? (
                      <div className="space-y-1">
                        <select
                          value={editShiftId}
                          onChange={(e) => setEditShiftId(e.target.value)}
                          className="w-full rounded border border-dark/10 bg-page px-1 py-1 text-[10px] text-dark"
                        >
                          <option value="">Turno...</option>
                          {availableShifts.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full rounded border border-dark/10 bg-page px-1 py-1 text-[10px] text-dark"
                        >
                          <option value="ANOTADOR">Anotador</option>
                          <option value="COCINERO">Cocinero</option>
                        </select>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => saveEdit(d)}
                            disabled={!editShiftId}
                            className="flex-1 rounded bg-sage py-0.5 text-[10px] font-semibold text-white disabled:opacity-30"
                          >
                            Asignar
                          </button>
                          <button
                            onClick={() => setEditingDay(null)}
                            className="rounded bg-dark/5 p-0.5 text-light-grey"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : assignment ? (
                      <div className="space-y-0.5">
                        <div className={`rounded px-1.5 py-1 text-[10px] ${
                          pending[d]?.action === 'delete'
                            ? 'bg-red-50 text-red-500 line-through'
                            : hasPending
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-green-50 text-green-600'
                        }`}>
                          <p className="font-medium">{assignment.shift.name}</p>
                          <p className="text-[9px] opacity-70">{assignment.role}</p>
                        </div>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => startEdit(d, assignment)}
                            className="rounded bg-dark/5 p-0.5 text-light-grey hover:text-dark"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={() => removeAssignment(d)}
                            className="rounded bg-dark/5 p-0.5 text-light-grey hover:text-red-500"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(d)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-dark/5 text-light-grey/60 hover:bg-dark/10 hover:text-light-grey"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-dark/10 bg-page/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <span className="text-sm text-light-grey">
              {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPending({})}
                className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:text-dark"
              >
                Descartar
              </button>
              <button
                onClick={saveAll}
                className="btn-sage text-sm"
              >
                <Save className="h-4 w-4" /> Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-20 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg px-4 py-2 text-sm shadow-lg border ${
                t.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
