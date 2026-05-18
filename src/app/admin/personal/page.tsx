'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Users, X, AlertCircle, CheckCircle, Download, Search } from 'lucide-react';
import { downloadCsv } from '@/lib/export-csv';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  customFields: string;
  createdAt: string;
}

interface CustomField {
  key: string;
  value: string;
}

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  openingProtocol?: string;
  closingProtocol?: string;
  assignments: { id: number; date: string; role: string; user: { id: number; name: string } }[];
}

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;

const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

function daysToString(checked: boolean[]): string {
  return checked.map((v, i) => v ? String(i) : null).filter(Boolean).join(',');
}

function stringToDays(str: string): boolean[] {
  const set = new Set(str.split(',').filter(Boolean).map(Number));
  return [0, 1, 2, 3, 4, 5, 6].map((d) => set.has(d));
}

export default function AdminPersonalPage() {
  const [tab, setTab] = useState<'employees' | 'shifts'>('employees');
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
  const [userCustomFields, setUserCustomFields] = useState<CustomField[]>([]);

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('14:00');
  const [daysChecked, setDaysChecked] = useState<boolean[]>([false, true, true, true, true, true, false]);
  const [openingProtocol, setOpeningProtocol] = useState<string[]>(['']);
  const [closingProtocol, setClosingProtocol] = useState<string[]>(['']);

  const [debts, setDebts] = useState<{ id: number; userId: number; reason: string; isPaid: boolean; createdAt: string; user: { id: number; name: string } }[]>([]);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtUserId, setDebtUserId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/shifts').then((r) => r.json()),
      fetch('/api/shift-debts').then((r) => r.json()),
    ])
      .then(([u, s, d]) => { setUsers(u); setShifts(s); setDebts(d); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openUserNew() {
    setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'EMPLOYEE' }); setUserCustomFields([]); setShowUserForm(true); setError('');
  }
  function openUserEdit(u: User) {
    setEditingUser(u); setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
    try {
      const cf = JSON.parse(u.customFields || '{}');
      setUserCustomFields(typeof cf === 'object' && cf !== null && !Array.isArray(cf) ? Object.entries(cf).map(([key, value]) => ({ key, value: String(value) })) : []);
    } catch { setUserCustomFields([]); }
    setShowUserForm(true); setError('');
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const cfObj: Record<string, string> = {};
    userCustomFields.forEach((f) => { if (f.key.trim()) cfObj[f.key.trim()] = f.value; });
    const body: Record<string, unknown> = { name: userForm.name, email: userForm.email, role: userForm.role, customFields: cfObj };
    if (userForm.password) body.password = userForm.password;
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { toast(editingUser ? '✅ Empleado actualizado' : '✅ Empleado guardado'); setShowUserForm(false); load(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function toggleActive(u: User) {
    await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !u.isActive }) });
    load();
  }

  async function handleShiftSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const body = {
      name: shiftName, startTime, endTime, daysOfWeek: daysToString(daysChecked),
      openingProtocol: JSON.stringify(openingProtocol.filter(s => s.trim())),
      closingProtocol: JSON.stringify(closingProtocol.filter(s => s.trim())),
    };
    const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
    const method = editingShift ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { toast(editingShift ? '✅ Turno actualizado' : '✅ Turno guardado'); setShowShiftForm(false); setEditingShift(null); load(); }
    else { const d = await res.json(); setError(d.error || 'Error'); }
  }

  async function deleteShift(id: number) { await fetch(`/api/shifts/${id}`, { method: 'DELETE' }); toast('🗑 Eliminado'); load(); }
  async function deleteAssignment(id: number) { await fetch(`/api/shift-assignments/${id}`, { method: 'DELETE' }); toast('🗑 Eliminado'); load(); }

  async function payDebt(id: number) {
    await fetch(`/api/shift-debts/${id}/pay`, { method: 'POST' });
    load();
  }

  function openShiftNew() {
    setEditingShift(null);
    setShiftName(''); setStartTime('08:00'); setEndTime('14:00');
    setDaysChecked([false, true, true, true, true, true, false]);
    setOpeningProtocol(['']); setClosingProtocol(['']);
    setShowShiftForm(true); setError('');
  }

  function openShiftEdit(s: Shift) {
    setEditingShift(s);
    setShiftName(s.name); setStartTime(s.startTime); setEndTime(s.endTime);
    setDaysChecked(stringToDays(s.daysOfWeek));
    let p, c;
    try { p = JSON.parse(s.openingProtocol || '[]'); } catch { p = []; }
    try { c = JSON.parse(s.closingProtocol || '[]'); } catch { c = []; }
    setOpeningProtocol(p.length > 0 ? p : ['']);
    setClosingProtocol(c.length > 0 ? c : ['']);
    setShowShiftForm(true); setError('');
  }

  async function exportEmployees() {
    const res = await fetch('/api/export/employees');
    const data = await res.json();
    downloadCsv(data, 'empleados');
  }

  async function exportShifts() {
    const res = await fetch('/api/export/shifts');
    const data = await res.json();
    downloadCsv(data, 'turnos');
  }

  const filteredUsers = search
    ? users.filter((u) => {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
    : users;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark">Gestión de Personal</h1>
        <div className="flex gap-2">
          {tab === 'employees' && (
            <button onClick={exportEmployees} className="flex items-center gap-2 rounded-lg border border-dark/10 px-3 py-2 text-sm text-grey hover:border-sage hover:text-sage">
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
          )}
          {tab === 'shifts' && (
            <button onClick={exportShifts} className="flex items-center gap-2 rounded-lg border border-dark/10 px-3 py-2 text-sm text-grey hover:border-sage hover:text-sage">
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex border-b border-dark/10">
        <button onClick={() => setTab('employees')} className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${tab === 'employees' ? 'scale-y-105 border-dark/10 bg-page text-dark' : 'border-transparent text-light-grey hover:text-grey'}`}>Empleados</button>
        <button onClick={() => setTab('shifts')} className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${tab === 'shifts' ? 'scale-y-105 border-dark/10 bg-page text-dark' : 'border-transparent text-light-grey hover:text-grey'}`}>Turnos</button>
      </div>

      {tab === 'employees' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-grey" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email..." className="w-full rounded-lg border border-dark/10 pl-9 pr-3 py-2 text-sm text-dark placeholder-light-grey" />
            </div>
            <button onClick={openUserNew} className="btn-sage text-sm">
              <Plus className="h-4 w-4" /> Nuevo empleado
            </button>
          </div>

          {showUserForm && (
            <div className="mb-6 rounded-xl border border-dark/10 bg-page p-5">
              <h2 className="mb-4 text-sm font-semibold text-dark">{editingUser ? 'Editar empleado' : 'Nuevo empleado'}</h2>
              {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</div>}
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="mb-1 block text-sm text-light-grey">Nombre</label><input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark" /></div>
                  <div><label className="mb-1 block text-sm text-light-grey">Email</label><input required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark" /></div>
                  <div><label className="mb-1 block text-sm text-light-grey">Contraseña {editingUser ? '(dejar vacía para no cambiar)' : ''}</label><input type="password" required={!editingUser} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark" /></div>
                  <div><label className="mb-1 block text-sm text-light-grey">Rol</label><select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark"><option value="EMPLOYEE">Empleado</option><option value="ADMIN">Administrador</option></select></div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm text-light-grey">Campos Personalizados</label>
                    <button type="button" onClick={() => setUserCustomFields((prev) => [...prev, { key: '', value: '' }])} className="flex items-center gap-1 text-xs text-sage hover:text-dark">
                      <Plus className="h-3 w-3" /> Añadir campo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {userCustomFields.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={f.key} onChange={(e) => setUserCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} className="flex-1 rounded-lg border border-dark/10 bg-page px-3 py-1.5 text-sm text-dark placeholder-light-grey" placeholder="Clave (ej: DNI)" />
                        <input value={f.value} onChange={(e) => setUserCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className="flex-1 rounded-lg border border-dark/10 bg-page px-3 py-1.5 text-sm text-dark placeholder-light-grey" placeholder="Valor" />
                        <button type="button" onClick={() => setUserCustomFields((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2"><button type="submit" className="btn-sage text-sm">{editingUser ? 'Actualizar' : 'Crear'}</button><button type="button" onClick={() => setShowUserForm(false)} className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:bg-dark/5">Cancelar</button></div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-dark/10">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark/10 bg-dark/5"><th className="px-4 py-3 text-left font-medium text-light-grey">Nombre</th><th className="px-4 py-3 text-left font-medium text-light-grey">Email</th><th className="px-4 py-3 text-left font-medium text-light-grey">Rol</th><th className="px-4 py-3 text-left font-medium text-light-grey">Activo</th><th className="px-4 py-3 text-right font-medium text-light-grey">Acciones</th></tr></thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const userDebts = debts.filter((d) => d.userId === u.id && !d.isPaid);
                  let cfCount = 0;
                  try { const cf = JSON.parse(u.customFields || '{}'); cfCount = typeof cf === 'object' && cf !== null ? Object.keys(cf).length : 0; } catch {}
                  return (
                  <tr key={u.id} className="border-b border-dark/5 hover:bg-dark/5">
                    <td className="px-4 py-3 text-dark">
                      <div className="flex items-center gap-2">
                        {u.name}
                        {cfCount > 0 && <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-500">{cfCount} campos</span>}
                        {userDebts.length > 0 && (
                          <button onClick={() => { setDebtUserId(u.id); setShowDebtModal(true); }} className="flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-100">
                            <AlertCircle className="h-3 w-3" /> {userDebts.length} deuda{userDebts.length > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-grey">{u.email}</td>
                    <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${u.role === 'ADMIN' ? 'bg-sage-light text-sage' : 'bg-blue-50 text-blue-500'}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><button onClick={() => toggleActive(u)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-dark/10 text-light-grey'}`}>{u.isActive ? 'Activo' : 'Inactivo'}</button></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <a href={`/admin/personal/asignar/${u.id}`} className="flex items-center gap-1 rounded-lg border border-dark/10 px-2.5 py-1.5 text-xs text-light-grey hover:border-sage hover:text-sage">
                          <Calendar className="h-3.5 w-3.5" /> Asignar
                        </a>
                        <button onClick={() => openUserEdit(u)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark"><Pencil className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-light-grey">{search ? 'Sin resultados para la búsqueda.' : 'No hay empleados registrados.'}</td></tr>}
              </tbody>
            </table>
          </div>

        </>
      )}

      {tab === 'shifts' && (
        <>
          <div className="mb-4 flex justify-end gap-2">
            <button onClick={openShiftNew} className="btn-sage text-sm">
              <Plus className="h-4 w-4" /> Nuevo turno
            </button>
          </div>

          {showShiftForm && (
            <div className="mb-6 rounded-xl border border-dark/10 bg-page p-5">
              <h2 className="mb-4 text-sm font-semibold text-dark">{editingShift ? 'Editar turno' : 'Nuevo horario de turno'}</h2>
              {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</div>}
              <form onSubmit={handleShiftSubmit} className="space-y-4">
                <div><label className="mb-1 block text-sm text-light-grey">Nombre</label><input required value={shiftName} onChange={(e) => setShiftName(e.target.value)} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark" placeholder="Mañana" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="mb-1 block text-sm text-light-grey">Hora inicio</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark" /></div>
                  <div><label className="mb-1 block text-sm text-light-grey">Hora fin</label><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-lg border border-dark/10 bg-page px-3 py-2 text-sm text-dark" /></div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-light-grey">Días de la semana</label>
                  <div className="flex gap-1">
                    {dayLabels.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDaysChecked((prev) => prev.map((v, j) => j === i ? !v : v))}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                          daysChecked[i]
                            ? 'bg-sage text-white'
                            : 'bg-dark/5 text-light-grey hover:bg-dark/10 hover:text-dark'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <details className="rounded-lg border border-dark/10 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-dark">Protocolo de apertura</summary>
                  <div className="mt-3 space-y-2">
                    {openingProtocol.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-light text-[10px] text-sage">{i + 1}</span>
                        <input value={step} onChange={(e) => setOpeningProtocol((prev) => prev.map((s, j) => j === i ? e.target.value : s))} className="flex-1 rounded-lg border border-dark/10 bg-page px-3 py-1.5 text-sm text-dark" placeholder={`Paso ${i + 1}`} />
                        {openingProtocol.length > 1 && <button type="button" onClick={() => setOpeningProtocol((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => setOpeningProtocol((prev) => [...prev, ''])} className="flex items-center gap-1 text-xs text-sage hover:text-dark"><Plus className="h-3 w-3" /> Añadir paso</button>
                  </div>
                </details>

                <details className="rounded-lg border border-dark/10 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-dark">Protocolo de cierre</summary>
                  <div className="mt-3 space-y-2">
                    {closingProtocol.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] text-amber-600">{i + 1}</span>
                        <input value={step} onChange={(e) => setClosingProtocol((prev) => prev.map((s, j) => j === i ? e.target.value : s))} className="flex-1 rounded-lg border border-dark/10 bg-page px-3 py-1.5 text-sm text-dark" placeholder={`Paso ${i + 1}`} />
                        {closingProtocol.length > 1 && <button type="button" onClick={() => setClosingProtocol((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => setClosingProtocol((prev) => [...prev, ''])} className="flex items-center gap-1 text-xs text-sage hover:text-dark"><Plus className="h-3 w-3" /> Añadir paso</button>
                  </div>
                </details>

                <div className="flex gap-2"><button type="submit" className="btn-sage text-sm">{editingShift ? 'Actualizar' : 'Crear'}</button><button type="button" onClick={() => setShowShiftForm(false)} className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:bg-dark/5">Cancelar</button></div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {shifts.map((shift) => (
              <div key={shift.id} className="rounded-xl border border-dark/10 bg-page p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-dark">{shift.name}</h3>
                    <p className="text-sm text-light-grey">{shift.startTime} - {shift.endTime}</p>
                    <div className="mt-1.5 flex gap-1">
                      {dayLabels.map((label, i) => {
                        const active = shift.daysOfWeek.split(',').includes(String(i));
                        return (
                          <span key={i} className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-semibold ${active ? 'bg-sage-light text-sage' : 'bg-dark/5 text-light-grey/60'}`}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openShiftEdit(shift)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteShift(shift.id)} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {shift.assignments.length > 0 && (
                  <div className="space-y-1.5">
                    {shift.assignments.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg bg-dark/5 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-light-grey" /><span className="text-dark">{a.user.name}</span><span className="rounded bg-dark/10 px-1.5 py-0.5 text-xs text-light-grey">{a.role}</span></div>
                        <div className="flex items-center gap-3"><span className="text-xs text-light-grey">{a.date}</span><button onClick={() => deleteAssignment(a.id)} className="text-light-grey hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
                      </div>
                    ))}
                    {shift.assignments.length > 5 && <p className="text-xs text-light-grey/60">+{shift.assignments.length - 5} más</p>}
                  </div>
                )}
                {shift.assignments.length === 0 && <p className="text-sm text-light-grey">Sin asignaciones</p>}
              </div>
            ))}
            {shifts.length === 0 && <p className="text-center text-light-grey">No hay turnos configurados.</p>}
          </div>
        </>
      )}

      {showDebtModal && debtUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl border border-dark/10 bg-page p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark">
                Deudas de {users.find((u) => u.id === debtUserId)?.name}
              </h2>
              <button onClick={() => setShowDebtModal(false)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {debts
                .filter((d) => d.userId === debtUserId)
                .map((d) => (
                  <div key={d.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${d.isPaid ? 'border-dark/10 bg-dark/5 opacity-60' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-3">
                      {d.isPaid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                      <div>
                        <p className="text-dark">{d.reason}</p>
                        <p className="text-xs text-light-grey">{new Date(d.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    {!d.isPaid && (
                      <button onClick={() => payDebt(d.id)} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100">
                        Marcar como pagada
                      </button>
                    )}
                    {d.isPaid && <span className="text-xs text-green-500">Pagada</span>}
                  </div>
                ))}
              {debts.filter((d) => d.userId === debtUserId).length === 0 && (
                <p className="py-6 text-center text-sm text-light-grey">No hay deudas registradas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-lg bg-page px-4 py-2 text-sm text-dark shadow-lg border border-dark/10">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
