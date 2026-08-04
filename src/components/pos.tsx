'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  X,
  Banknote,
  CreditCard,
  ScrollText,
  ArrowUp,
  ArrowDown,
  Check,
  Trash2,
  Package as PackageIcon,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, ModalShell, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { BookmarkTabs } from '@/components/shared'
import { get, post, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { eur } from '@/lib/format'
import type { Product, Protocol, SaleItem, PaymentMethod } from '@/lib/types'

// ---------- Sandbox view (local state, no DB) ----------

interface SandboxComanda {
  id: string
  name: string
  price: number
  priority: number
  payment: PaymentMethod
  status: 'PENDING' | 'DELIVERED'
}

export function SandboxPizarra({ products }: { products: Product[] }) {
  const [order, setOrder] = useState<string[]>(() => products.map((p) => p.id))
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('todos')
  const [paymentModal, setPaymentModal] = useState<Product | null>(null)
  const [protocolModal, setProtocolModal] = useState<Protocol | null>(null)
  const [comandas, setComandas] = useState<SandboxComanda[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])

  useEffect(() => {
    setOrder(products.map((p) => p.id))
  }, [products])

  useEffect(() => {
    get<Protocol[]>('/api/protocols').then(setProtocols).catch(() => {})
  }, [])

  const tags = useMemo(() => {
    const s = new Set<string>()
    for (const p of products) for (const t of p.tags || []) s.add(t)
    return ['todos', ...Array.from(s).sort()]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return order
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .filter((p) => (activeTag === 'todos' ? true : (p!.tags || []).includes(activeTag)))
      .filter((p) => (q ? p!.name.toLowerCase().includes(q) : true)) as Product[]
  }, [order, products, search, activeTag])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setOrder((prev) => {
      const oldI = prev.indexOf(active.id as string)
      const newI = prev.indexOf(over.id as string)
      return arrayMove(prev, oldI, newI)
    })
  }

  function addSale(product: Product, payment: PaymentMethod) {
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setComandas((prev) => [
      ...prev,
      {
        id,
        name: product.name,
        price: product.price,
        priority: prev.filter((c) => c.status === 'PENDING').length,
        payment,
        status: 'PENDING',
      },
    ])
    setPaymentModal(null)
    toast.success(`Venta simulada: ${product.name} (${payment === 'cash' ? 'efectivo' : 'tarjeta'})`)
  }

  function move(id: string, dir: -1 | 1) {
    setComandas((prev) => {
      const pending = prev.filter((c) => c.status === 'PENDING')
      const idx = pending.findIndex((c) => c.id === id)
      if (idx === -1) return prev
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= pending.length) return prev
      const reordered = [...pending]
      ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
      // reassign priorities
      reordered.forEach((c, i) => (c.priority = i))
      // merge back: keep DELIVERED items first, then pending by priority
      const delivered = prev.filter((c) => c.status === 'DELIVERED')
      return [...delivered, ...reordered]
    })
  }

  function markDone(id: string) {
    setComandas((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, status: 'DELIVERED' as const } : c))
      // reassign priorities among pending
      let p = 0
      return next.map((c) => {
        if (c.status === 'PENDING') return { ...c, priority: p++ }
        return c
      })
    })
  }

  function remove(id: string) {
    setComandas((prev) => {
      const next = prev.filter((c) => c.id !== id)
      let p = 0
      return next.map((c) => {
        if (c.status === 'PENDING') return { ...c, priority: p++ }
        return c
      })
    })
  }

  const pending = comandas.filter((c) => c.status === 'PENDING')
  const delivered = comandas.filter((c) => c.status === 'DELIVERED')
  const total = delivered.reduce((s, c) => s + c.price, 0)
  const cashTotal = delivered.filter((c) => c.payment === 'cash').reduce((s, c) => s + c.price, 0)
  const cardTotal = delivered.filter((c) => c.payment === 'card').reduce((s, c) => s + c.price, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* Pizarra */}
      <div>
        <BookmarkTabs
          active={activeTag}
          onChange={setActiveTag}
          tabs={tags.map((t) => ({ id: t, label: t === 'todos' ? 'Todos' : t }))}
        />
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="input-wellness pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground z-10"
              aria-label="Limpiar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<PackageIcon className="w-6 h-6" />} title="Sin productos" />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={search || activeTag !== 'todos' ? [] : filtered.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((p) => {
                  const productProtocol = protocols.find((pr) => pr.productId === p.id)
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      draggable={!search && activeTag === 'todos'}
                      hasProtocol={!!productProtocol}
                      onProtocol={() => productProtocol && setProtocolModal(productProtocol)}
                      onClick={() => setPaymentModal(p)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Comandas panel */}
      <div className="lg:sticky lg:top-20 self-start">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg">Comandas simuladas</h3>
            <Badge variant="muted">{pending.length} pendientes</Badge>
          </div>

          {comandas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Haz click en un producto para crear una venta simulada.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto custom-scroll pr-1">
              {pending
                .sort((a, b) => a.priority - b.priority)
                .map((c) => (
                  <ComandaItem
                    key={c.id}
                    comanda={c}
                    onUp={() => move(c.id, -1)}
                    onDown={() => move(c.id, 1)}
                    onDone={() => markDone(c.id)}
                    onRemove={() => remove(c.id)}
                  />
                ))}
              {delivered.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 opacity-60">
                  <span className="text-sm line-through">{c.name}</span>
                  <span className="text-sm text-sage">{eur(c.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
            <Row label="Total vendido" value={eur(total)} bold />
            <Row label="Efectivo" value={eur(cashTotal)} icon={<Banknote className="w-3.5 h-3.5" />} />
            <Row label="Tarjeta" value={eur(cardTotal)} icon={<CreditCard className="w-3.5 h-3.5" />} />
          </div>
        </Card>
      </div>

      {paymentModal && (
        <PaymentModal
          product={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSelect={(m) => addSale(paymentModal, m)}
        />
      )}

      {protocolModal && (
        <ProtocolModal protocol={protocolModal} onClose={() => setProtocolModal(null)} />
      )}
    </div>
  )
}

// ---------- Shared sub-components ----------

function ProductCard({
  product,
  draggable,
  hasProtocol,
  onProtocol,
  onClick,
}: {
  product: Product
  draggable: boolean
  hasProtocol: boolean
  onProtocol: () => void
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !draggable,
  })
  const [imgError, setImgError] = useState(false)
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Normalize imageUrl: accept absolute URLs, relative paths, or data URIs
  const imgUrl = product.imageUrl?.trim() || ''
  const showImg = imgUrl && !imgError

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`card-wellness p-3 flex flex-col gap-2 ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div
        {...listeners}
        className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden relative"
        onClick={(e) => {
          // Only trigger click if not dragging (clicks during drag are prevented by activationConstraint)
          onClick()
        }}
      >
        {showImg ? (
          <img
            src={imgUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <PackageIcon className="w-8 h-8" />
            {imgError && <span className="text-[10px]">sin imagen</span>}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        {hasProtocol && (
          <button
            className="btn-ghost p-1 -mt-1 -mr-1 text-sage"
            onClick={(e) => {
              e.stopPropagation()
              onProtocol()
            }}
            aria-label="Ver protocolo"
            title="Protocolo"
          >
            <ScrollText className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-sage font-semibold">{eur(product.price)}</p>
    </div>
  )
}

function ComandaItem({
  comanda,
  onUp,
  onDown,
  onDone,
  onRemove,
}: {
  comanda: { id: string; name: string; price: number; priority: number; payment: PaymentMethod }
  onUp: () => void
  onDown: () => void
  onDone: () => void
  onRemove: () => void
}) {
  return (
    <li className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
      <span className="w-7 h-7 rounded-full bg-[color:var(--sage)] text-[color:var(--sage-foreground)] inline-flex items-center justify-center text-xs font-bold shrink-0">
        {comanda.priority + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{comanda.name}</p>
        <p className="text-xs text-sage font-semibold inline-flex items-center gap-1">
          {comanda.payment === 'cash' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
          {eur(comanda.price)}
        </p>
      </div>
      <div className="flex items-center gap-0.5">
        <button className="btn-ghost p-1" onClick={onUp} aria-label="Subir prioridad" title="Subir">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button className="btn-ghost p-1" onClick={onDown} aria-label="Bajar prioridad" title="Bajar">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button className="btn-ghost p-1 text-sage" onClick={onDone} aria-label="Entregar" title="Entregado">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button className="btn-ghost p-1 text-muted-foreground hover:text-[color:var(--warn)]" onClick={onRemove} aria-label="Eliminar" title="Eliminar">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  )
}

function PaymentModal({
  product,
  onClose,
  onSelect,
}: {
  product: Product
  onClose: () => void
  onSelect: (m: PaymentMethod) => void
}) {
  return (
    <ModalShell
      open
      onClose={onClose}
      title={product.name}
      description={`Selecciona el método de pago · ${eur(product.price)}`}
      size="sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          className="card-wellness hover-lift p-6 flex flex-col items-center gap-3 text-center"
          onClick={() => onSelect('cash')}
        >
          <div className="w-12 h-12 rounded-full bg-[rgba(127,166,155,0.15)] text-sage flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">Efectivo</p>
            <p className="text-xs text-muted-foreground">{eur(product.price)}</p>
          </div>
        </button>
        <button
          className="card-wellness hover-lift p-6 flex flex-col items-center gap-3 text-center"
          onClick={() => onSelect('card')}
        >
          <div className="w-12 h-12 rounded-full bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)] flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">Tarjeta</p>
            <p className="text-xs text-muted-foreground">{eur(product.price)}</p>
          </div>
        </button>
      </div>
    </ModalShell>
  )
}

function ProtocolModal({ protocol, onClose }: { protocol: Protocol; onClose: () => void }) {
  return (
    <ModalShell
      open
      onClose={onClose}
      title={protocol.name}
      description={protocol.description || `Protocolo de tipo ${protocol.type}`}
      size="md"
    >
      <ol className="space-y-3">
        {(protocol.steps || []).map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-[color:var(--sage)] text-[color:var(--sage-foreground)] inline-flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed pt-0.5">{step}</p>
          </li>
        ))}
      </ol>
    </ModalShell>
  )
}

function Row({
  label,
  value,
  icon,
  bold,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  bold?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold text-foreground text-base pt-1' : 'text-muted-foreground'}`}>
      <span className="inline-flex items-center gap-1.5">
        {icon} {label}
      </span>
      <span className={bold ? 'text-sage' : ''}>{value}</span>
    </div>
  )
}

// ---------- Live POS component (uses DB) ----------

interface LiveComanda extends SaleItem {
  payment: PaymentMethod
  name: string
}

export function LivePizarra({ employeeId }: { employeeId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('todos')
  const [paymentModal, setPaymentModal] = useState<Product | null>(null)
  const [protocolModal, setProtocolModal] = useState<Protocol | null>(null)
  const [comandas, setComandas] = useState<LiveComanda[]>([])
  const [loading, setLoading] = useState(true)
  const refreshTimer = useRef<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [p, prots] = await Promise.all([
          get<Product[]>('/api/products?active=true'),
          get<Protocol[]>('/api/protocols'),
        ])
        setProducts(p)
        setProtocols(prots)
        setOrder(p.map((x) => x.id))
      } catch {
        toast.error('No se pudieron cargar productos')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Refresh pending sale items every 5s and on focus
  async function loadComandas() {
    try {
      // We need all pending sale items for the employee — fetch recent sales and pull items
      const sales = await get<any[]>(`/api/sales?employeeId=${employeeId}`)
      const items: LiveComanda[] = []
      for (const s of sales) {
        for (const it of s.items || []) {
          if (it.status === 'PENDING') {
            items.push({ ...it, payment: s.paymentMethod, name: it.productName })
          }
        }
      }
      // Also load any DELIVERED in the last 24h for totals
      const now = new Date()
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const deliveredToday: LiveComanda[] = []
      for (const s of sales) {
        if (new Date(s.createdAt) < cutoff) continue
        for (const it of s.items || []) {
          if (it.status === 'DELIVERED') {
            deliveredToday.push({ ...it, payment: s.paymentMethod, name: it.productName })
          }
        }
      }
      setComandas([...items.sort((a, b) => a.priority - b.priority), ...deliveredToday])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadComandas()
    refreshTimer.current = window.setInterval(loadComandas, 8000)
    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current)
    }
  }, [employeeId])

  const tags = useMemo(() => {
    const s = new Set<string>()
    for (const p of products) for (const t of p.tags || []) s.add(t)
    return ['todos', ...Array.from(s).sort()]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return order
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .filter((p) => (activeTag === 'todos' ? true : (p!.tags || []).includes(activeTag)))
      .filter((p) => (q ? p!.name.toLowerCase().includes(q) : true)) as Product[]
  }, [order, products, search, activeTag])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setOrder((prev) => {
      const oldI = prev.indexOf(active.id as string)
      const newI = prev.indexOf(over.id as string)
      return arrayMove(prev, oldI, newI)
    })
  }

  async function addSale(product: Product, payment: PaymentMethod) {
    try {
      await post('/api/sales', {
        employeeId,
        items: [{ productId: product.id, productName: product.name, price: product.price, quantity: 1 }],
        paymentMethod: payment,
        total: product.price,
      })
      toast.success(`Venta registrada: ${product.name}`)
      setPaymentModal(null)
      loadComandas()
    } catch {
      toast.error('No se pudo registrar la venta')
    }
  }

  async function markDone(itemId: string) {
    try {
      await put(`/api/sale-items/${itemId}`, { status: 'DELIVERED' })
      toast.success('Comanda entregada')
      loadComandas()
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  async function removeItem(itemId: string) {
    if (!confirm('¿Eliminar esta comanda?')) return
    try {
      await del(`/api/sale-items/${itemId}`)
      toast.success('Comanda eliminada')
      loadComandas()
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  async function movePriority(itemId: string, dir: -1 | 1) {
    // Sort pending items by (priority asc, createdAt asc) for a stable order across sales
    const pending = comandas
      .filter((c) => c.status === 'PENDING')
      .slice()
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority
        // fallback: older first (createdAt string ISO compares lexicographically)
        return (a.createdAt || '').localeCompare(b.createdAt || '')
      })
    const idx = pending.findIndex((c) => c.id === itemId)
    if (idx === -1) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= pending.length) return
    // Swap positions in the array
    const reordered = [...pending]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    // Reassign priorities 0..n-1 sequentially so order is globally stable
    try {
      await Promise.all(
        reordered.map((item, i) =>
          item.priority === i
            ? Promise.resolve()
            : put(`/api/sale-items/${item.id}`, { priority: i })
        )
      )
      loadComandas()
    } catch {
      toast.error('No se pudo reordenar')
    }
  }

  const pending = comandas.filter((c) => c.status === 'PENDING')
  const delivered = comandas.filter((c) => c.status === 'DELIVERED')
  const total = delivered.reduce((s, c) => s + c.price * c.quantity, 0)
  const cashTotal = delivered.filter((c) => c.payment === 'cash').reduce((s, c) => s + c.price * c.quantity, 0)
  const cardTotal = delivered.filter((c) => c.payment === 'card').reduce((s, c) => s + c.price * c.quantity, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* Pizarra */}
      <div>
        <BookmarkTabs
          active={activeTag}
          onChange={setActiveTag}
          tabs={tags.map((t) => ({ id: t, label: t === 'todos' ? 'Todos' : t }))}
        />
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="input-wellness pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground z-10"
              aria-label="Limpiar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <LoadingBlock label="Cargando productos…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<PackageIcon className="w-6 h-6" />} title="Sin productos" />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={!search && activeTag === 'todos' ? filtered.map((p) => p.id) : []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((p) => {
                  const productProtocol = protocols.find((pr) => pr.productId === p.id)
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      draggable={!search && activeTag === 'todos'}
                      hasProtocol={!!productProtocol}
                      onProtocol={() => productProtocol && setProtocolModal(productProtocol)}
                      onClick={() => setPaymentModal(p)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Comandas panel */}
      <div className="lg:sticky lg:top-20 self-start">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg">Comandas</h3>
            <Badge variant="muted">{pending.length} pendientes</Badge>
          </div>
          {comandas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Haz click en un producto para registrar una venta.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto custom-scroll pr-1">
              {pending
                .slice()
                .sort((a, b) => {
                  if (a.priority !== b.priority) return a.priority - b.priority
                  return (a.createdAt || '').localeCompare(b.createdAt || '')
                })
                .map((c) => (
                  <ComandaItem
                    key={c.id}
                    comanda={c}
                    onUp={() => movePriority(c.id, -1)}
                    onDown={() => movePriority(c.id, 1)}
                    onDone={() => markDone(c.id)}
                    onRemove={() => removeItem(c.id)}
                  />
                ))}
              {delivered.length > 0 && (
                <li className="pt-2 mt-2 border-t border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Entregadas hoy ({delivered.length})
                  </p>
                  <div className="space-y-1">
                    {delivered.slice(0, 20).map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-1 opacity-70">
                        <span className="truncate">{c.productName}</span>
                        <span className="text-sage">{eur(c.price * c.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
            <Row label="Total vendido" value={eur(total)} bold />
            <Row label="Efectivo" value={eur(cashTotal)} icon={<Banknote className="w-3.5 h-3.5" />} />
            <Row label="Tarjeta" value={eur(cardTotal)} icon={<CreditCard className="w-3.5 h-3.5" />} />
          </div>
        </Card>
      </div>

      {paymentModal && (
        <PaymentModal
          product={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSelect={(m) => addSale(paymentModal, m)}
        />
      )}
      {protocolModal && (
        <ProtocolModal protocol={protocolModal} onClose={() => setProtocolModal(null)} />
      )}
    </div>
  )
}
