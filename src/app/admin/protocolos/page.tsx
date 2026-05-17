'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, FileText } from 'lucide-react';

interface Protocol {
  id: number;
  type: string;
  name: string;
  description: string;
  steps: string;
  productId: number | null;
  product: { id: number; name: string } | null;
  completions: { id: number; date: string; completed: boolean }[];
}

export default function AdminProtocolosPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Protocol | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ type: 'APERTURA', name: '', description: '', steps: '' });

  const [cocinaSteps, setCocinaSteps] = useState<string[]>(['']);
  const [editingCocina, setEditingCocina] = useState<Protocol | null>(null);

  const [tab, setTab] = useState<'general' | 'cocina' | 'producto'>('general');

  function load() {
    setLoading(true);
    fetch('/api/protocols').then((r) => r.json()).then(setProtocols).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ type: 'APERTURA', name: '', description: '', steps: '' }); setShowForm(true); setError(''); }
  function openEdit(p: Protocol) { setEditing(p); setForm({ type: p.type, name: p.name, description: p.description, steps: p.steps }); setShowForm(true); setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const body = { type: form.type, name: form.name, description: form.description, steps: form.steps ? form.steps.split('\n').map((s) => s.trim()).filter(Boolean) : [] };
    const url = editing ? `/api/protocols/${editing.id}` : '/api/protocols';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setShowForm(false); load(); } else { const d = await res.json(); setError(d.error || 'Error al guardar'); }
  }

  async function deleteProtocol(id: number) { await fetch(`/api/protocols/${id}`, { method: 'DELETE' }); load(); }

  function openCocinaEdit(p: Protocol) {
    setEditingCocina(p);
    try { setCocinaSteps(JSON.parse(p.steps)); } catch { setCocinaSteps(['']); }
  }

  async function saveCocina() {
    if (!editingCocina) return;
    const filtered = cocinaSteps.filter((s) => s.trim());
    await fetch(`/api/protocols/${editingCocina.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: filtered }),
    });
    setEditingCocina(null);
    load();
  }

  if (loading) return <div className="text-center text-light-grey">Cargando...</div>;

  const generalProtocols = protocols.filter((p) => p.type === 'APERTURA' || p.type === 'CIERRE');
  const cocinaProtocols = protocols.filter((p) => p.type === 'COCINA');
  const productProtocols = protocols.filter((p) => p.type === 'PRODUCTO');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark">Protocolos</h1>
        <button onClick={openNew} className="btn-sage text-sm"><Plus className="h-4 w-4" /> Nuevo protocolo</button>
      </div>

      <div className="mb-6 flex border-b border-dark/10">
        <button onClick={() => setTab('general')} className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${tab === 'general' ? 'scale-y-105 border-dark/10 bg-white text-dark' : 'border-transparent text-light-grey hover:text-grey'}`}>Apertura y Cierre</button>
        <button onClick={() => setTab('cocina')} className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${tab === 'cocina' ? 'scale-y-105 border-dark/10 bg-white text-dark' : 'border-transparent text-light-grey hover:text-grey'}`}>
          Cocina
          {cocinaProtocols.length > 0 && <span className="ml-2 rounded-full bg-sage-light px-1.5 py-0.5 text-xs text-sage">{cocinaProtocols.length}</span>}
        </button>
        <button onClick={() => setTab('producto')} className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${tab === 'producto' ? 'scale-y-105 border-dark/10 bg-white text-dark' : 'border-transparent text-light-grey hover:text-grey'}`}>Producto</button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-dark/10 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-dark">{editing ? 'Editar protocolo' : 'Nuevo protocolo'}</h2>
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm text-light-grey">Tipo</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark"><option value="APERTURA">Apertura</option><option value="CIERRE">Cierre</option><option value="COCINA">Cocina</option><option value="PRODUCTO">Producto</option></select></div>
              <div><label className="mb-1 block text-sm text-light-grey">Nombre</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" placeholder="Protocolo de apertura" /></div>
            </div>
            <div><label className="mb-1 block text-sm text-light-grey">Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" /></div>
            <div><label className="mb-1 block text-sm text-light-grey">Pasos (uno por línea)</label><textarea value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} rows={4} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark font-mono" placeholder="Verificar luces&#10;Prender máquinas&#10;Revisar inventario" /></div>
            <div className="flex gap-2"><button type="submit" className="btn-sage text-sm">{editing ? 'Actualizar' : 'Crear'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:bg-dark/5">Cancelar</button></div>
          </form>
        </div>
      )}

      {tab === 'general' && (
        <div className="space-y-4">
          {generalProtocols.map((p) => {
            let steps: string[] = [];
            try { steps = JSON.parse(p.steps); } catch { steps = []; }
            return (
              <div key={p.id} className="rounded-xl border border-dark/10 bg-white p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dark">{p.name}</h3>
                      <span className="rounded bg-dark/5 px-1.5 py-0.5 text-xs text-light-grey">{p.type}</span>
                    </div>
                    {p.description && <p className="mt-1 text-sm text-light-grey">{p.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteProtocol(p.id)} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {steps.length > 0 && <div className="space-y-1">{steps.map((step, i) => (<div key={i} className="flex items-center gap-2 rounded-lg bg-dark/5 px-3 py-1.5 text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-dark/10 text-xs text-light-grey">{i + 1}</span><span className="text-grey">{step}</span></div>))}</div>}
              </div>
            );
          })}
          {generalProtocols.length === 0 && <p className="text-center text-light-grey">No hay protocolos de apertura o cierre.</p>}
        </div>
      )}

      {tab === 'cocina' && (
        <div className="space-y-4">
          {cocinaProtocols.map((p) => {
            let steps: string[] = [];
            try { steps = JSON.parse(p.steps); } catch { steps = []; }
            return (
              <div key={p.id} className="rounded-xl border border-dark/10 bg-white p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sage" />
                      <h3 className="font-semibold text-dark">{p.name}</h3>
                    </div>
                    {p.product && <p className="mt-1 text-sm text-light-grey">Producto: {p.product.name}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openCocinaEdit(p)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteProtocol(p.id)} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {steps.length > 0 && <div className="space-y-1">{steps.map((step, i) => (<div key={i} className="flex items-center gap-2 rounded-lg bg-dark/5 px-3 py-1.5 text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-dark/10 text-xs text-light-grey">{i + 1}</span><span className="text-grey">{step}</span></div>))}</div>}
                {steps.length === 0 && <p className="text-sm text-light-grey">Sin pasos definidos.</p>}
              </div>
            );
          })}
          {cocinaProtocols.length === 0 && <p className="text-center text-light-grey">No hay protocolos de cocina. Crea uno desde la edición de un producto.</p>}
        </div>
      )}

      {tab === 'producto' && (
        <div className="space-y-4">
          {productProtocols.map((p) => {
            let steps: string[] = [];
            try { steps = JSON.parse(p.steps); } catch { steps = []; }
            return (
              <div key={p.id} className="rounded-xl border border-dark/10 bg-white p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dark">{p.name}</h3>
                      <span className="rounded bg-dark/5 px-1.5 py-0.5 text-xs text-light-grey">PRODUCTO</span>
                    </div>
                    {p.product && <p className="mt-1 text-sm text-light-grey">Producto: {p.product.name}</p>}
                    {p.description && <p className="mt-1 text-sm text-light-grey">{p.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteProtocol(p.id)} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {steps.length > 0 && <div className="space-y-1">{steps.map((step, i) => (<div key={i} className="flex items-center gap-2 rounded-lg bg-dark/5 px-3 py-1.5 text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-dark/10 text-xs text-light-grey">{i + 1}</span><span className="text-grey">{step}</span></div>))}</div>}
              </div>
            );
          })}
          {productProtocols.length === 0 && <p className="text-center text-light-grey">No hay protocolos de producto.</p>}
        </div>
      )}

      {editingCocina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingCocina(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-dark/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-dark">Editar: {editingCocina.name}</h2>
            <div className="mb-4 space-y-2">
              {cocinaSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dark/5 text-xs text-light-grey">{i + 1}</span>
                  <textarea value={step} onChange={(e) => setCocinaSteps((prev) => prev.map((s, j) => j === i ? e.target.value : s))} rows={2} className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" placeholder={`Paso ${i + 1}`} />
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button type="button" onClick={() => setCocinaSteps((prev) => prev.map((s, j) => j === i - 1 ? prev[j] : j === i ? prev[j - 1] : s))} disabled={i === 0} className="rounded p-0.5 text-light-grey hover:text-dark disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => setCocinaSteps((prev) => prev.map((s, j) => j === i + 1 ? prev[j] : j === i ? prev[j + 1] : s))} disabled={i === cocinaSteps.length - 1} className="rounded p-0.5 text-light-grey hover:text-dark disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                  </div>
                  <button type="button" onClick={() => setCocinaSteps((prev) => prev.filter((_, j) => j !== i))} disabled={cocinaSteps.length === 1} className="rounded p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500 disabled:opacity-20"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setCocinaSteps((prev) => [...prev, ''])} className="mb-4 flex items-center gap-1 text-xs text-sage hover:text-dark"><Plus className="h-3 w-3" /> Añadir paso</button>
            <div className="flex gap-2">
              <button onClick={saveCocina} className="btn-sage flex-1 text-sm">Guardar</button>
              <button onClick={() => setEditingCocina(null)} className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:bg-dark/5">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
