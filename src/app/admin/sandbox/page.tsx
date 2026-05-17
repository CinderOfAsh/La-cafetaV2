'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  X,
  Beaker,
  ScrollText,
  CreditCard,
  Banknote,
  Coffee,
  Search,
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  tags: string;
  description: string;
  imageUrl: string;
  protocol: { id: number; name: string; steps: string; description: string } | null;
}

interface Protocol {
  id: number;
  type: string;
  name: string;
  description: string;
  imageUrl: string;
  steps: string;
}

interface Comanda {
  id: string;
  productName: string;
  price: number;
  priority: number;
  status: 'pending' | 'done';
  paymentMethod: string;
}

interface Pos {
  x: number;
  y: number;
}

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;

const TAG_COLORS = [
  { bg: 'bg-amber-400', text: 'text-amber-950', board: 'bg-amber-500/[0.04]', tab: 'bg-amber-400/30', tabActive: 'bg-amber-400' },
  { bg: 'bg-blue-400', text: 'text-blue-950', board: 'bg-blue-500/[0.04]', tab: 'bg-blue-400/30', tabActive: 'bg-blue-400' },
  { bg: 'bg-green-400', text: 'text-green-950', board: 'bg-green-500/[0.04]', tab: 'bg-green-400/30', tabActive: 'bg-green-400' },
  { bg: 'bg-red-400', text: 'text-red-950', board: 'bg-red-500/[0.04]', tab: 'bg-red-400/30', tabActive: 'bg-red-400' },
  { bg: 'bg-purple-400', text: 'text-purple-950', board: 'bg-purple-500/[0.04]', tab: 'bg-purple-400/30', tabActive: 'bg-purple-400' },
  { bg: 'bg-pink-400', text: 'text-pink-950', board: 'bg-pink-500/[0.04]', tab: 'bg-pink-400/30', tabActive: 'bg-pink-400' },
  { bg: 'bg-indigo-400', text: 'text-indigo-950', board: 'bg-indigo-500/[0.04]', tab: 'bg-indigo-400/30', tabActive: 'bg-indigo-400' },
  { bg: 'bg-teal-400', text: 'text-teal-950', board: 'bg-teal-500/[0.04]', tab: 'bg-teal-400/30', tabActive: 'bg-teal-400' },
  { bg: 'bg-orange-400', text: 'text-orange-950', board: 'bg-orange-500/[0.04]', tab: 'bg-orange-400/30', tabActive: 'bg-orange-400' },
  { bg: 'bg-cyan-400', text: 'text-cyan-950', board: 'bg-cyan-500/[0.04]', tab: 'bg-cyan-400/30', tabActive: 'bg-cyan-400' },
];

function getTagColor(tag: string, allTags: string[]) {
  const idx = allTags.indexOf(tag) % TAG_COLORS.length;
  return TAG_COLORS[idx];
}

const CARD_W = 180;
const CARD_H = 140;
const GAP = 12;
const TAB_H = 36;

export default function SandboxPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [comandas, setComandas] = useState<Comanda[]>([]);

  const [showApertura, setShowApertura] = useState(false);
  const [aperturaSteps, setAperturaSteps] = useState<{ step: string; done: boolean }[]>([]);

  const [showSaleModal, setShowSaleModal] = useState<Product | null>(null);
  const [showProtocolModal, setShowProtocolModal] = useState<{ name: string; steps: string[] } | null>(null);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [cierreSteps, setCierreSteps] = useState<{ step: string; done: boolean }[]>([]);

  const [positions, setPositions] = useState<Record<number, Pos>>({});
  const [dragging, setDragging] = useState<number | null>(null);
  const dragOffset = useRef<Pos>({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/products?active=true').then((r) => r.json()),
      fetch('/api/protocols').then((r) => r.json()),
    ]).then(([p, prot]) => {
      setProducts(p);
      setProtocols(prot);
      const apertura = prot.find((x: Protocol) => x.type === 'APERTURA');
      if (apertura) {
        let steps: string[] = [];
        try { steps = JSON.parse(apertura.steps); } catch {}
        setAperturaSteps(steps.map((s) => ({ step: s, done: false })));
        setShowApertura(true);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (products.length > 0 && Object.keys(positions).length === 0) {
      const cols = Math.max(1, Math.floor(((boardRef.current?.clientWidth || 900) - 32) / (CARD_W + GAP)));
      const newPositions: Record<number, Pos> = {};
      products.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions[p.id] = { x: 16 + col * (CARD_W + GAP), y: TAB_H + 68 + row * (CARD_H + GAP) };
      });
      setPositions(newPositions);
    }
  }, [products]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      try { JSON.parse(p.tags).forEach((t: string) => set.add(t)); } catch {}
    });
    return [...set];
  }, [products]);

  const baseFiltered = selectedTag
    ? products.filter((p) => { try { return JSON.parse(p.tags).includes(selectedTag); } catch { return false; } })
    : products;

  const filtered = search
    ? baseFiltered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : baseFiltered;

  const activeColor = selectedTag ? getTagColor(selectedTag, allTags) : null;

  const handleMouseDown = useCallback((e: React.MouseEvent, productId: number) => {
    if (selectedTag || search) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    setDragging(productId);
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, [selectedTag, search]);

  useEffect(() => {
    if (dragging === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;
      const rawX = e.clientX - boardRect.left - dragOffset.current.x;
      const rawY = e.clientY - boardRect.top - dragOffset.current.y;
      const x = Math.max(0, Math.min(rawX, boardRect.width - CARD_W));
      const y = Math.max(0, Math.min(rawY, boardRect.height - CARD_H));
      setPositions((prev) => ({ ...prev, [dragging]: { x, y } }));
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  function addToComandas(p: Product, method: string) {
    const nextPri = comandas.filter((c) => c.status === 'pending').length + 1;
    setComandas((prev) => [...prev, { id: `${p.id}-${Date.now()}`, productName: p.name, price: p.price, priority: nextPri, status: 'pending', paymentMethod: method }]);
    toast('✅ Venta registrada');
    setShowSaleModal(null);
  }

  function deliver(id: string) {
    setComandas((prev) => {
      const delivered = prev.map((c) => c.id === id ? { ...c, status: 'done' as const } : c);
      const pending = delivered.filter((c) => c.status === 'pending').sort((a, b) => a.priority - b.priority);
      return delivered.map((c) => {
        if (c.status === 'pending') {
          const idx = pending.findIndex((x) => x.id === c.id);
          return { ...c, priority: idx + 1 };
        }
        return c;
      });
    });
    toast('✅ Entregado');
  }

  function deleteComanda(id: string) {
    setComandas((prev) => prev.filter((c) => c.id !== id));
    toast('🗑 Eliminado');
  }

  function movePriority(id: string, dir: -1 | 1) {
    setComandas((prev) => {
      const list = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const swap = idx + dir;
      if (swap < 0 || swap >= list.length) return prev;
      [list[idx], list[swap]] = [list[swap], list[idx]];
      return list.map((c, i) => ({ ...c, priority: i + 1 }));
    });
  }

  function openProtocol(p: Product) {
    if (p.protocol) {
      let steps: string[] = [];
      try { steps = JSON.parse(p.protocol.steps); } catch {}
      setShowProtocolModal({ name: p.name, steps });
    } else {
      setShowProtocolModal({ name: p.name, steps: ['No hay protocolo definido para este producto.'] });
    }
  }

  function completeApertura() {
    setShowApertura(false);
  }

  function openCierre() {
    const cierre = protocols.find((x) => x.type === 'CIERRE');
    if (cierre) {
      let steps: string[] = [];
      try { steps = JSON.parse(cierre.steps); } catch {}
      setCierreSteps(steps.map((s) => ({ step: s, done: false })));
    }
    setShowCierreModal(true);
  }

  const totalSales = comandas.filter((c) => c.status === 'done').reduce((s, c) => s + c.price, 0);
  const totalCash = comandas.filter((c) => c.status === 'done' && c.paymentMethod === 'cash').reduce((s, c) => s + c.price, 0);
  const totalCard = comandas.filter((c) => c.status === 'done' && c.paymentMethod === 'card').reduce((s, c) => s + c.price, 0);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-light-grey">Cargando...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-53px)] gap-4 overflow-hidden p-4">
      {/* PIZARRA */}
      <div ref={boardRef} className={`relative flex-1 overflow-hidden rounded-2xl border border-dark/10 ${activeColor?.board || 'bg-white'}`}>
        {/* Bookmark tabs */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-end gap-1 px-4 pt-1" style={{ height: TAB_H }}>
          <button
            onClick={() => { setSelectedTag(null); setSearch(''); }}
            className={`flex h-7 items-center rounded-t-lg px-3 text-[11px] font-semibold transition-all ${!selectedTag ? 'bg-sage text-white shadow-lg translate-y-0' : 'bg-dark/5 text-light-grey hover:text-dark translate-y-1'}`}
          >
            Todos
          </button>
          {allTags.map((tag) => {
            const color = getTagColor(tag, allTags);
            const active = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => { setSelectedTag(active ? null : tag); setSearch(''); }}
                className={`flex h-7 items-center rounded-t-lg px-3 text-[11px] font-semibold transition-all ${active ? `${color.tabActive} text-white shadow-lg translate-y-0` : `${color.tab} text-light-grey hover:text-dark translate-y-1`}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Header */}
        <div className="absolute left-0 right-0 z-10 flex items-center gap-2 px-4" style={{ top: TAB_H }}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-grey" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." className="w-full rounded-lg border border-dark/10 bg-dark/5 pl-10 pr-8 py-2 text-sm text-dark placeholder-light-grey" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-light-grey hover:text-dark">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Beaker className="h-5 w-5 text-sage" />
          <div>
            <h1 className="text-lg font-bold text-dark">Sandbox</h1>
            <p className="text-xs text-light-grey">Simulador — datos en memoria, sin impacto en BD</p>
          </div>
          <button
            onClick={openCierre}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-dark/10 px-3 py-1.5 text-xs text-light-grey hover:border-red-700 hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" /> Cerrar Turno
          </button>
        </div>

        {/* Products */}
        <div className="relative w-full h-full overflow-y-auto" style={{ paddingTop: TAB_H + 53 }}>
          {!selectedTag && !search && filtered.map((p) => {
            const pos = positions[p.id] || { x: 0, y: 0 };
            return (
              <div
                key={p.id}
                data-product
                onMouseDown={(e) => handleMouseDown(e, p.id)}
                className={`absolute w-[180px] cursor-grab select-none rounded-xl border border-dark/10 bg-white p-4 transition-shadow ${dragging === p.id ? 'z-30 cursor-grabbing shadow-xl shadow-dark/10' : 'z-10 hover:shadow-lg hover:shadow-dark/5'}`}
                style={{ left: pos.x, top: pos.y }}
              >
                {p.imageUrl && (
                  <div className="-mx-4 -mt-4 mb-2 h-16 overflow-hidden rounded-t-xl">
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <p className="text-sm font-semibold text-dark">{p.name}</p>
                <p className="mt-1 text-lg font-bold text-sage">${p.price.toFixed(2)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(() => { try { return JSON.parse(p.tags); } catch { return []; } })().map((tag: string) => {
                    const tc = getTagColor(tag, allTags);
                    return (
                      <span key={tag} className={`rounded-full ${tc.bg}/10 ${tc.text} px-1.5 py-0.5 text-[10px]`}>{tag}</span>
                    );
                  })}
                </div>
                <div className="mt-auto flex gap-1.5 pt-3">
                  <button
                    onClick={() => setShowSaleModal(p)}
                    className="btn-sage flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold"
                  >
                    VENDER
                  </button>
                  <button
                    onClick={() => openProtocol(p)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-dark/10 px-2 py-1.5 text-xs text-light-grey hover:bg-dark/5 hover:text-dark"
                    title="Protocolo"
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {(selectedTag || search) && (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((p) => (
                <div key={p.id} className="flex flex-col rounded-xl border border-dark/10 bg-white p-4">
                  {p.imageUrl && (
                    <div className="-mx-4 -mt-4 mb-2 h-16 overflow-hidden rounded-t-xl">
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-dark">{p.name}</p>
                  <p className="mt-1 text-lg font-bold text-sage">${p.price.toFixed(2)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(() => { try { return JSON.parse(p.tags); } catch { return []; } })().map((tag: string) => {
                      const tc = getTagColor(tag, allTags);
                      return (
                        <span key={tag} className={`rounded-full ${tc.bg}/10 ${tc.text} px-1.5 py-0.5 text-[10px]`}>{tag}</span>
                      );
                    })}
                  </div>
                  <div className="mt-auto flex gap-1.5 pt-3">
                    <button
                      onClick={() => setShowSaleModal(p)}
                      className="btn-sage flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold"
                    >
                      VENDER
                    </button>
                    <button
                      onClick={() => openProtocol(p)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-dark/10 px-2 py-1.5 text-xs text-light-grey hover:bg-dark/5 hover:text-dark"
                      title="Protocolo"
                    >
                      <ScrollText className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-light-grey">No hay productos con este filtro.</div>
          )}
        </div>
      </div>

      {/* COMANDAS */}
      <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-dark/10 bg-white">
        <div className="flex items-center gap-2 border-b border-dark/10 px-4 py-3">
          <ShoppingCart className="h-4 w-4 text-sage" />
          <h2 className="text-sm font-semibold text-dark">Comandas</h2>
          <span className="ml-auto text-xs text-light-grey">{comandas.filter((c) => c.status === 'pending').length} pend.</span>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {comandas.length === 0 ? (
            <p className="py-8 text-center text-xs text-light-grey">Sin comandas.</p>
          ) : (
            <div className="space-y-1.5">
              {comandas
                .sort((a, b) => a.priority - b.priority)
                .map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg border px-3 py-2 transition-all ${
                      c.status === 'done'
                        ? 'border-green-800 bg-green-500/5 opacity-60'
                        : c.priority === 1
                          ? 'border-sage/20 bg-sage/5'
                          : 'border-dark/10 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-dark">{c.productName}</p>
                        <p className="text-xs text-light-grey">
                          ${c.price.toFixed(2)}
                          {c.paymentMethod === 'cash' ? ' · Efectivo' : c.paymentMethod === 'card' ? ' · Datáfono' : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${c.priority === 1 && c.status === 'pending' ? 'bg-sage text-white' : 'bg-dark/5 text-light-grey'}`}>
                          {c.priority}
                        </span>
                        <button
                          onClick={() => deleteComanda(c.id)}
                          className="flex h-5 w-5 items-center justify-center rounded text-light-grey hover:bg-red-500/10 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {c.status === 'pending' && (
                      <div className="mt-1.5 flex gap-1">
                        <button
                          onClick={() => deliver(c.id)}
                          className="flex flex-1 items-center justify-center gap-1 rounded bg-green-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-green-500"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Entregar
                        </button>
                        <button
                          onClick={() => movePriority(c.id, -1)}
                          className="rounded bg-dark/5 p-1 text-light-grey hover:text-dark"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => movePriority(c.id, 1)}
                          className="rounded bg-dark/5 p-1 text-light-grey hover:text-dark"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="border-t border-dark/10 p-3 text-xs">
          <div className="flex justify-between text-grey">
            <span>Vendidos: {comandas.filter((c) => c.status === 'done').length}</span>
            <span className="text-sage font-bold">${totalSales.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between text-light-grey text-[11px]">
            <span>Efectivo: ${totalCash.toFixed(2)}</span>
            <span>Datáfono: ${totalCard.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SALE MODAL */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSaleModal(null)}>
          <div className="w-full max-w-xs rounded-2xl border border-dark/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-lg font-bold text-dark">{showSaleModal.name}</h3>
            <p className="mb-4 text-sm text-sage">${showSaleModal.price.toFixed(2)}</p>
            <p className="mb-1 text-xs font-medium text-grey">Método de pago</p>
            <div className="space-y-2">
              <button
                onClick={() => addToComandas(showSaleModal, 'cash')}
                className="flex w-full items-center gap-3 rounded-xl border border-dark/10 bg-white px-4 py-3 text-left text-sm text-dark hover:border-sage/50"
              >
                <Banknote className="h-5 w-5 text-green-400" /> Efectivo
              </button>
              <button
                onClick={() => addToComandas(showSaleModal, 'card')}
                className="flex w-full items-center gap-3 rounded-xl border border-dark/10 bg-white px-4 py-3 text-left text-sm text-dark hover:border-sage/50"
              >
                <CreditCard className="h-5 w-5 text-blue-400" /> Datáfono
              </button>
            </div>
            <button onClick={() => setShowSaleModal(null)} className="mt-4 w-full rounded-lg border border-dark/10 py-2 text-xs text-light-grey hover:text-dark">Cancelar</button>
          </div>
        </div>
      )}

      {/* PROTOCOL MODAL */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowProtocolModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-dark/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-bold text-dark">Protocolo: {showProtocolModal.name}</h3>
            <div className="mb-4 space-y-1.5">
              {showProtocolModal.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-dark/5 px-3 py-2 text-sm text-grey">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-dark/5 text-xs text-light-grey">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <button onClick={() => setShowProtocolModal(null)} className="btn-sage w-full rounded-full py-2 text-sm font-semibold">Cerrar</button>
          </div>
        </div>
      )}

      {/* APERTURA MODAL */}
      {showApertura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-dark/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Coffee className="h-5 w-5 text-sage" />
              <h2 className="text-lg font-bold text-dark">Protocolo de Apertura</h2>
            </div>
            <p className="mb-4 text-xs text-light-grey">Completa los pasos antes de comenzar.</p>
            <div className="mb-6 space-y-2">
              {aperturaSteps.map((s, i) => (
                <label key={i} className="flex items-center gap-3 rounded-lg bg-dark/5 px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => setAperturaSteps((prev) => prev.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
                    className="h-4 w-4 rounded accent-sage"
                  />
                  <span className={`text-sm ${s.done ? 'text-light-grey line-through' : 'text-dark'}`}>{s.step}</span>
                </label>
              ))}
            </div>
            <button
              onClick={completeApertura}
              disabled={!aperturaSteps.every((s) => s.done)}
              className="btn-sage w-full rounded-full py-2 text-sm font-semibold disabled:opacity-30"
            >
              Iniciar Turno
            </button>
          </div>
        </div>
      )}

      {/* CIERRE MODAL */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-dark/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <X className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-dark">Protocolo de Cierre</h2>
            </div>

            <div className="mb-4 rounded-lg border border-dark/10 bg-dark/5 p-3">
              <p className="text-xs text-grey">Resumen del turno</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-light-grey">Ventas:</span> <span className="text-dark">{comandas.filter((c) => c.status === 'done').length}</span></div>
                <div><span className="text-light-grey">Total:</span> <span className="text-sage font-bold">${totalSales.toFixed(2)}</span></div>
                <div><span className="text-light-grey">Efectivo:</span> <span className="text-green-400">${totalCash.toFixed(2)}</span></div>
                <div><span className="text-light-grey">Datáfono:</span> <span className="text-blue-400">${totalCard.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              {cierreSteps.map((s, i) => (
                <label key={i} className="flex items-center gap-3 rounded-lg bg-dark/5 px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => setCierreSteps((prev) => prev.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
                    className="h-4 w-4 rounded accent-sage"
                  />
                  <span className={`text-sm ${s.done ? 'text-light-grey line-through' : 'text-dark'}`}>{s.step}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCierreModal(false)}
                className="flex-1 rounded-lg border border-dark/10 py-2 text-sm text-light-grey hover:text-dark"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowCierreModal(false); setComandas([]); }}
                disabled={!cierreSteps.every((s) => s.done)}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-30"
              >
                Finalizar Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
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
