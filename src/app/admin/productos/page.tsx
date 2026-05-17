'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, AlertTriangle, Download, Trash2, FileText, ScrollText, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { downloadCsv } from '@/lib/export-csv';

interface Product {
  id: number;
  name: string;
  price: number;
  tags: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
  customFields: string;
  inventory: { stock: number; minStock: number; unit: string } | null;
}

interface InvItem {
  id: number;
  stock: number;
  minStock: number;
  unit: string;
  customFields: string;
  product: { id: number; name: string; price: number; isActive: boolean };
}

interface CustomField {
  key: string;
  value: string;
}

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;

export default function AdminProductosPage() {
  const [tab, setTab] = useState<'products' | 'inventory'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', price: '', tags: '', description: '', imageUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [editingInv, setEditingInv] = useState<number | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editMin, setEditMin] = useState('');
  const [invCustomFields, setInvCustomFields] = useState<CustomField[]>([]);

  const [showCocinaModal, setShowCocinaModal] = useState(false);
  const [cocinaProductId, setCocinaProductId] = useState<number | null>(null);
  const [cocinaProductName, setCocinaProductName] = useState('');
  const [cocinaSteps, setCocinaSteps] = useState<string[]>(['']);
  const [cocinaProtocolId, setCocinaProtocolId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/inventory').then((r) => r.json()),
    ])
      .then(([p, i]) => {
        setProducts(p);
        setInvItems(i);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: '', price: '', tags: '', description: '', imageUrl: '' });
    setCustomFields([]);
    setShowForm(true);
    setError('');
  }

  function openEdit(p: Product) {
    setEditing(p);
    const parsedTags = (() => { try { return JSON.parse(p.tags).join(', '); } catch { return p.tags; } })();
    setForm({ name: p.name, price: String(p.price), tags: parsedTags, description: p.description, imageUrl: p.imageUrl });
    try {
      const cf = JSON.parse(p.customFields || '{}');
      setCustomFields(typeof cf === 'object' && cf !== null && !Array.isArray(cf) ? Object.entries(cf).map(([key, value]) => ({ key, value: String(value) })) : []);
    } catch {
      setCustomFields([]);
    }
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cfObj: Record<string, string> = {};
    customFields.forEach((f) => { if (f.key.trim()) cfObj[f.key.trim()] = f.value; });

    const body: Record<string, unknown> = {
      name: form.name,
      price: parseFloat(form.price),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      description: form.description,
      imageUrl: form.imageUrl,
      customFields: cfObj,
    };

    const url = editing ? `/api/products/${editing.id}` : '/api/products';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast(editing ? '✅ Producto actualizado' : '✅ Producto guardado');
      setShowForm(false);
      loadData();
    } else {
      const data = await res.json();
      setError(data.error || 'Error al guardar');
    }
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    loadData();
  }

  function openEditInv(item: InvItem) {
    setEditingInv(item.id);
    setEditStock(String(item.stock));
    setEditMin(String(item.minStock));
    try {
      const cf = JSON.parse(item.customFields || '{}');
      setInvCustomFields(typeof cf === 'object' && cf !== null && !Array.isArray(cf) ? Object.entries(cf).map(([key, value]) => ({ key, value: String(value) })) : []);
    } catch {
      setInvCustomFields([]);
    }
  }

  async function saveEditInv(item: InvItem) {
    const cfObj: Record<string, string> = {};
    invCustomFields.forEach((f) => { if (f.key.trim()) cfObj[f.key.trim()] = f.value; });
    await fetch(`/api/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: parseInt(editStock) || 0, minStock: parseInt(editMin) || 0, customFields: cfObj }),
    });
    setEditingInv(null);
    toast('✅ Inventario actualizado');
    loadData();
  }

  const activeInv = invItems.filter((i) => i.product.isActive);
  const lowStock = activeInv.filter((i) => i.stock <= i.minStock);

  async function exportProducts() {
    const res = await fetch('/api/export/products');
    const data = await res.json();
    downloadCsv(data, 'productos');
  }

  function openCocinaEditor(p: Product) {
    setCocinaProductId(p.id);
    setCocinaProductName(p.name);
    setCocinaProtocolId(null);
    setCocinaSteps(['']);
    fetch(`/api/protocols?type=COCINA`)
      .then((r) => r.json())
      .then((list: { id: number; productId: number | null; steps: string }[]) => {
        const existing = list.find((x) => x.productId === p.id);
        if (existing) {
          setCocinaProtocolId(existing.id);
          try { setCocinaSteps(JSON.parse(existing.steps)); } catch { setCocinaSteps(['']); }
        }
        setShowCocinaModal(true);
      })
      .catch(() => setShowCocinaModal(true));
  }

  async function saveCocinaProtocol() {
    if (!cocinaProductId) return;
    const product = products.find((p) => p.id === cocinaProductId);
    if (!product) return;

    const filteredSteps = cocinaSteps.filter((s) => s.trim());
    const body = {
      type: 'COCINA',
      name: `Cocina: ${product.name}`,
      description: '',
      steps: filteredSteps,
      productId: cocinaProductId,
    };

    if (cocinaProtocolId) {
      await fetch(`/api/protocols/${cocinaProtocolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    toast('✅ Protocolo guardado');
    setShowCocinaModal(false);
  }

  const filteredProducts = search
    ? products.filter((p) => {
        const q = search.toLowerCase();
        const tags = (() => { try { return JSON.parse(p.tags).join(' '); } catch { return ''; } })();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || tags.toLowerCase().includes(q);
      })
    : products;

  const filteredInv = search
    ? activeInv.filter((item) => {
        const q = search.toLowerCase();
        return item.product.name.toLowerCase().includes(q) || item.unit.toLowerCase().includes(q);
      })
    : activeInv;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark">Productos</h1>
        <button onClick={exportProducts} className="flex items-center gap-2 rounded-lg border border-dark/10 px-3 py-2 text-sm text-grey hover:border-sage hover:text-sage">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      <div className="mb-6 flex border-b border-dark/10">
        <button
          onClick={() => setTab('products')}
          className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${
            tab === 'products'
              ? 'scale-y-105 border-dark/10 bg-white text-dark'
              : 'border-transparent text-light-grey hover:text-grey'
          }`}
        >
          Productos en Venta
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`-mb-px rounded-t-lg border border-b-0 px-5 py-2.5 text-sm font-medium ${
            tab === 'inventory'
              ? 'scale-y-105 border-dark/10 bg-white text-dark'
              : 'border-transparent text-light-grey hover:text-grey'
          }`}
        >
          Inventario
          {lowStock.length > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-500">
              {lowStock.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-grey" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, descripción, tags..." className="w-full rounded-lg border border-dark/10 pl-10 pr-3 py-2 text-sm text-dark placeholder-light-grey" />
            </div>
            <button
              onClick={openNew}
              className="btn-sage text-sm"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
          </div>

          {showForm && (
            <div className="mb-6 rounded-xl border border-dark/10 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-dark">
                {editing ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-light-grey">Nombre</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-light-grey">Precio</label>
                    <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-light-grey">Tags (separados por coma)</label>
                    <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" placeholder="bebida, caliente" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-light-grey">Descripción</label>
                    <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-light-grey">Imagen (URL)</label>
                    <div className="flex items-center gap-3">
                      <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark" placeholder="https://ejemplo.com/foto.jpg" />
                      {form.imageUrl && (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-dark/10">
                          <img src={form.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239CA3AF"><rect width="24" height="24" rx="4"/><text x="12" y="16" text-anchor="middle" font-size="14" fill="white">?</text></svg>' }} />
                          <button type="button" onClick={() => setForm({ ...form, imageUrl: '' })} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm text-light-grey">Campos Personalizados</label>
                    <button type="button" onClick={() => setCustomFields((prev) => [...prev, { key: '', value: '' }])} className="flex items-center gap-1 text-xs text-sage hover:text-dark">
                      <Plus className="h-3 w-3" /> Añadir campo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customFields.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={f.key} onChange={(e) => setCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-sm text-dark placeholder-light-grey" placeholder="Clave (ej: Proveedor)" />
                        <input value={f.value} onChange={(e) => setCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-sm text-dark placeholder-light-grey" placeholder="Valor" />
                        <button type="button" onClick={() => setCustomFields((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn-sage text-sm">
                    {editing ? 'Actualizar' : 'Crear'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:bg-dark/5">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-dark/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark/10 bg-dark/5">
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Imagen</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Precio</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Activo</th>
                  <th className="px-4 py-3 text-right font-medium text-light-grey">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  let cfCount = 0;
                  try { const cf = JSON.parse(p.customFields || '{}'); cfCount = typeof cf === 'object' && cf !== null ? Object.keys(cf).length : 0; } catch {}
                  return (
                    <tr key={p.id} className="border-b border-dark/5 hover:bg-dark/5">
                      <td className="px-4 py-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg border border-dark/10 object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark/5 text-xs text-light-grey">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-dark">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {p.name}
                            {cfCount > 0 && (
                              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-500">{cfCount} campos</span>
                            )}
                          </div>
                          {(() => {
                            try {
                              const cf = JSON.parse(p.customFields || '{}');
                              if (typeof cf !== 'object' || cf === null) return null;
                              const entries = Object.entries(cf).filter(([,v]) => v);
                              if (entries.length === 0) return null;
                              return (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {entries.map(([k, v]) => (
                                    <span key={k} className="rounded bg-dark/5 px-1.5 py-0.5 text-[10px] text-grey">
                                      {k}: {String(v)}
                                    </span>
                                  ))}
                                </div>
                              );
                            } catch { return null; }
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-dark">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={p.inventory && p.inventory.stock <= p.inventory.minStock ? 'text-red-500' : 'text-grey'}>
                          {p.inventory?.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? 'bg-green-50 text-green-600' : 'bg-dark/10 text-light-grey'}`}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openCocinaEditor(p)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark" title="Protocolo de cocina">
                            <ScrollText className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`¿Eliminar ${p.name}?`)) return;
                            await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                            toast('🗑 Producto eliminado');
                            loadData();
                          }} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500" title="Eliminar producto">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-light-grey">{search ? 'Sin resultados para la búsqueda.' : 'No hay productos registrados.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'inventory' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-grey" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por producto, unidad..." className="w-full rounded-lg border border-dark/10 pl-10 pr-3 py-2 text-sm text-dark placeholder-light-grey" />
            </div>
            {lowStock.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                <AlertTriangle className="h-3 w-3" />{lowStock.length} bajo mínimo
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-dark/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark/10 bg-dark/5">
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Producto</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Precio</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-light-grey">Mínimo</th>
                  <th className="px-4 py-3 text-right font-medium text-light-grey">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInv.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  const isEditing = editingInv === item.id;
                  return (
                    <>
                    <tr key={item.id} className={`border-b border-dark/5 hover:bg-dark/5 ${isLow ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 text-dark">{item.product.name}</td>
                      <td className="px-4 py-3 text-grey">${item.product.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} className="w-20 rounded border border-dark/10 bg-white px-2 py-1 text-sm text-dark" autoFocus />
                        ) : (
                          <span className={isLow ? 'font-semibold text-red-500' : 'text-grey'}>{item.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} className="w-20 rounded border border-dark/10 bg-white px-2 py-1 text-sm text-dark" />
                        ) : (
                          <span className="text-light-grey">{item.minStock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEditInv(item)} className="btn-sage px-3 py-1 text-xs">Guardar</button>
                              <button onClick={() => setEditingInv(null)} className="rounded-lg px-3 py-1 text-xs text-light-grey hover:text-dark">Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openEditInv(item)} className="rounded-lg p-1.5 text-light-grey hover:bg-dark/5 hover:text-dark">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={async () => {
                                if (!confirm(`¿Eliminar inventario de ${item.product.name}?`)) return;
                                await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
                                toast('🗑 Inventario eliminado');
                                loadData();
                              }} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500" title="Eliminar inventario">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr key={`${item.id}-cf`}>
                        <td colSpan={6} className="border-b border-dark/5 bg-dark/5 px-4 py-3">
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs text-light-grey">Campos Personalizados</label>
                            <button type="button" onClick={() => setInvCustomFields((prev) => [...prev, { key: '', value: '' }])} className="flex items-center gap-1 text-xs text-sage hover:text-dark">
                              <Plus className="h-3 w-3" /> Añadir campo
                            </button>
                          </div>
                          <div className="space-y-2">
                            {invCustomFields.map((f, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input value={f.key} onChange={(e) => setInvCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-sm text-dark placeholder-light-grey" placeholder="Clave (ej: Proveedor)" />
                                <input value={f.value} onChange={(e) => setInvCustomFields((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-sm text-dark placeholder-light-grey" placeholder="Valor" />
                                <button type="button" onClick={() => setInvCustomFields((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  );
                })}
                {filteredInv.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-light-grey">{search ? 'Sin resultados para la búsqueda.' : 'No hay inventario registrado.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showCocinaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCocinaModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-dark/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-sage" />
              <h2 className="text-lg font-bold text-dark">Protocolo de Cocina: {cocinaProductName}</h2>
            </div>

            <div className="mb-4 space-y-2">
              {cocinaSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dark/5 text-xs text-light-grey">{i + 1}</span>
                  <textarea
                    value={step}
                    onChange={(e) => setCocinaSteps((prev) => prev.map((s, j) => j === i ? e.target.value : s))}
                    rows={2}
                    className="flex-1 rounded-lg border border-dark/10 bg-white px-3 py-2 text-sm text-dark placeholder-light-grey"
                    placeholder={`Paso ${i + 1}`}
                  />
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button type="button" onClick={() => setCocinaSteps((prev) => prev.map((s, j) => j === i - 1 ? prev[j] : j === i ? prev[j - 1] : s))} disabled={i === 0} className="rounded p-0.5 text-light-grey hover:text-dark disabled:opacity-20">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => setCocinaSteps((prev) => prev.map((s, j) => j === i + 1 ? prev[j] : j === i ? prev[j + 1] : s))} disabled={i === cocinaSteps.length - 1} className="rounded p-0.5 text-light-grey hover:text-dark disabled:opacity-20">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <button type="button" onClick={() => setCocinaSteps((prev) => prev.filter((_, j) => j !== i))} disabled={cocinaSteps.length === 1} className="rounded p-1.5 text-light-grey hover:bg-red-50 hover:text-red-500 disabled:opacity-20">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setCocinaSteps((prev) => [...prev, ''])} className="mb-4 flex items-center gap-1 text-xs text-sage hover:text-dark">
              <Plus className="h-3 w-3" /> Añadir paso
            </button>

            <div className="flex gap-2">
              <button onClick={saveCocinaProtocol} className="btn-sage flex-1 text-sm">
                {cocinaProtocolId ? 'Actualizar' : 'Crear'}
              </button>
              <button onClick={() => setShowCocinaModal(false)} className="rounded-lg border border-dark/10 px-4 py-2 text-sm text-grey hover:bg-dark/5">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-lg bg-white px-4 py-2 text-sm text-dark shadow-lg border border-dark/10">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
