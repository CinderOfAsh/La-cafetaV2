'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;

export default function AdminMateriasPrimasPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [form, setForm] = useState({ name: '', unit: 'unidad', stock: '0', minStock: '5' });
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }

  function loadData() {
    setLoading(true);
    fetch('/api/raw-materials')
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: '', unit: 'unidad', stock: '0', minStock: '5' });
    setShowForm(true);
  }

  function openEdit(m: RawMaterial) {
    setEditing(m);
    setForm({
      name: m.name,
      unit: m.unit,
      stock: String(m.stock),
      minStock: String(m.minStock),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/raw-materials/${editing.id}` : '/api/raw-materials';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        unit: form.unit,
        stock: parseInt(form.stock) || 0,
        minStock: parseInt(form.minStock) || 5,
      }),
    });

    if (res.ok) {
      toast(editing ? '✅ Actualizada' : '✅ Materia prima creada');
      setShowForm(false);
      loadData();
    } else {
      toast('❌ Error al guardar');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta materia prima?')) return;
    const res = await fetch(`/api/raw-materials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('🗑️ Eliminada');
      loadData();
    }
  }

  const lowStock = materials.filter((m) => m.stock <= m.minStock);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-accent" style={{ fontFamily: 'var(--font-indie)' }}>
          Materias Primas
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF6B9D] to-[#E8457A] px-4 py-2 text-sm font-semibold text-white hover:shadow-md hover:shadow-[#FF6B9D]/20 transition-all"
          style={{ fontFamily: 'var(--font-indie)' }}
        >
          <Plus className="h-4 w-4" /> Nueva materia prima
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          {lowStock.length} materia(s) prima(s) con stock bajo
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-default bg-page p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-accent" style={{ fontFamily: 'var(--font-indie)' }}>
            {editing ? 'Editar materia prima' : 'Nueva materia prima'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm text-muted" style={{ fontFamily: 'var(--font-indie)' }}>Nombre</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-page px-3 py-2 text-sm text-accent" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted" style={{ fontFamily: 'var(--font-indie)' }}>Unidad</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full rounded-lg border border-input bg-page px-3 py-2 text-sm text-accent">
                <option value="unidad">unidad</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="paquete">paquete</option>
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm text-muted" style={{ fontFamily: 'var(--font-indie)' }}>Stock actual</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-lg border border-input bg-page px-3 py-2 text-sm text-accent" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm text-muted" style={{ fontFamily: 'var(--font-indie)' }}>Stock mínimo</label>
                <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="w-full rounded-lg border border-input bg-page px-3 py-2 text-sm text-accent" />
              </div>
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit"
                className="rounded-lg bg-gradient-to-r from-[#FF6B9D] to-[#E8457A] px-4 py-2 text-sm font-semibold text-white">
                {editing ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-lg border border-default px-4 py-2 text-sm text-accent">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-default bg-page shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default text-muted">
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Unidad</th>
              <th className="px-4 py-3 text-left font-medium">Stock</th>
              <th className="px-4 py-3 text-left font-medium">Stock mínimo</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No hay materias primas registradas</td></tr>
            )}
            {materials.map((m) => {
              const isLow = m.stock <= m.minStock;
              return (
                <tr key={m.id} className="border-b border-default last:border-0">
                  <td className="px-4 py-3 font-medium text-accent">{m.name}</td>
                  <td className="px-4 py-3 text-muted">{m.unit}</td>
                  <td className="px-4 py-3 text-accent">{m.stock} {m.unit}</td>
                  <td className="px-4 py-3 text-accent">{m.minStock} {m.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      isLow
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-green-500/10 text-green-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} />
                      {isLow ? 'Stock bajo' : 'Stock OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(m)}
                        className="rounded-lg p-1.5 text-muted hover:bg-[#F3E8FF] hover:text-[#A78BFA]">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-lg bg-page px-4 py-2 text-sm text-accent shadow-lg border border-default">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
