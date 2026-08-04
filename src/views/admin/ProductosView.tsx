'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { BookmarkTabs, Card, ModalShell, Toolbar, Badge, KVEditor } from '@/components/shared'
import { LoadingBlock, EmptyState } from '@/components/ui-bits'
import { useAppStore } from '@/lib/store'
import { get, post, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { eur } from '@/lib/format'
import type { Product, Inventory } from '@/lib/types'

export function ProductosView() {
  const setView = useAppStore((s) => s.setView)
  const [tab, setTab] = useState<'productos' | 'inventario'>('productos')

  return (
    <>
      <AppHeader title="Productos" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookmarkTabs
          active={tab}
          onChange={(id) => setTab(id as 'productos' | 'inventario')}
          tabs={[
            { id: 'productos', label: 'Productos' },
            { id: 'inventario', label: 'Inventario' },
          ]}
        />
        {tab === 'productos' ? <ProductosTab /> : <InventarioTab />}
      </main>
    </>
  )
}

// ---------- Productos tab ----------

function ProductosTab() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await get<Product[]>('/api/products')
      setItems(data)
    } catch {
      toast.error('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) => p.name.toLowerCase().includes(q))
  }, [items, search])

  function exportCsv() {
    const rows = items.map((p) => ({
      nombre: p.name,
      precio: p.price,
      etiquetas: (p.tags || []).join('; '),
      stock: p.inventory?.stock ?? '',
      minStock: p.inventory?.minStock ?? '',
      unidad: p.inventory?.unit ?? '',
      activo: p.isActive ? 'sí' : 'no',
    }))
    downloadCsv(rows, 'productos.csv')
    toast.success('CSV descargado')
  }

  return (
    <div>
      <Toolbar>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="input-wellness pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button className="btn-outline text-sm" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button className="btn-sage text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </Toolbar>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingBlock label="Cargando productos…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="w-6 h-6" />}
            title="Sin productos"
            description="No hay productos que coincidan con la búsqueda."
          />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nombre</th>
                  <th className="text-left font-medium px-4 py-3">Precio</th>
                  <th className="text-left font-medium px-4 py-3">Etiquetas</th>
                  <th className="text-left font-medium px-4 py-3">Stock</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-medium px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sage font-semibold">{eur(p.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="muted">
                            {t}
                          </Badge>
                        ))}
                        {(p.tags || []).length > 3 && (
                          <Badge variant="muted">+{p.tags.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.inventory ? (
                        <span className={p.inventory.stock < p.inventory.minStock ? 'text-[color:var(--warn)] font-medium' : ''}>
                          {p.inventory.stock} {p.inventory.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <Badge variant="sage">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge variant="muted">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          className="btn-ghost p-2"
                          onClick={() => setEditing(p)}
                          aria-label={`Editar ${p.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar "${p.name}"?`)) return
                            try {
                              await del(`/api/products/${p.id}`)
                              toast.success('Producto eliminado')
                              load()
                            } catch {
                              toast.error('No se pudo eliminar')
                            }
                          }}
                          aria-label={`Eliminar ${p.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(creating || editing) && (
        <ProductDialog
          product={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function ProductDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [tags, setTags] = useState((product?.tags || []).join(', '))
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    product?.customFields || {}
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim() || !price) {
      toast.error('Nombre y precio son obligatorios')
      return
    }
    const body = {
      name: name.trim(),
      price: parseFloat(price),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: imageUrl || null,
      description: description || null,
      isActive,
      customFields,
    }
    setSaving(true)
    try {
      if (isEdit && product) {
        await put(`/api/products/${product.id}`, body)
        toast.success('Producto actualizado')
      } else {
        await post('/api/products', body)
        toast.success('Producto creado')
      }
      onSaved()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      description={isEdit ? product?.name : 'Rellena los campos para crear el producto.'}
      size="lg"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-sage text-sm" onClick={save} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Nombre *</label>
          <input
            className="input-wellness"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Café con leche"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Precio (€) *</label>
          <input
            className="input-wellness"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder="1.50"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Etiquetas (coma)</label>
          <input
            className="input-wellness"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Bebidas, Café"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">URL de imagen</label>
          <input
            className="input-wellness"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/uploads/cafe.jpg"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Descripción</label>
          <textarea
            className="input-wellness min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción opcional del producto"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Estado</label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[color:var(--sage)]"
            />
            <span className="text-sm">Producto activo (visible en POS)</span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <KVEditor value={customFields} onChange={setCustomFields} />
        </div>
      </div>
    </ModalShell>
  )
}

// ---------- Inventario tab ----------

function InventarioTab() {
  const [items, setItems] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await get<Inventory[]>('/api/inventory')
      setItems(data)
    } catch {
      toast.error('No se pudo cargar el inventario')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => (i.product?.name || '').toLowerCase().includes(q))
  }, [items, search])

  function exportCsv() {
    const rows = items.map((i) => ({
      producto: i.product?.name ?? '',
      stock: i.stock,
      minStock: i.minStock,
      unidad: i.unit,
      estado: i.stock < i.minStock ? 'crítico' : 'ok',
    }))
    downloadCsv(rows, 'inventario.csv')
    toast.success('CSV descargado')
  }

  return (
    <div>
      <Toolbar>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="input-wellness pl-9"
          />
        </div>
        <button className="btn-outline text-sm" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </Toolbar>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingBlock label="Cargando inventario…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="w-6 h-6" />}
            title="Inventario vacío"
            description="No hay items de inventario para mostrar."
          />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Producto</th>
                  <th className="text-left font-medium px-4 py-3 w-28">Stock</th>
                  <th className="text-left font-medium px-4 py-3 w-28">Mínimo</th>
                  <th className="text-left font-medium px-4 py-3 w-20">Unidad</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-medium px-4 py-3 w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((i) => (
                  <InventoryRow key={i.id} item={i} onSaved={load} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function InventoryRow({ item, onSaved }: { item: Inventory; onSaved: () => void }) {
  const [stock, setStock] = useState(String(item.stock))
  const [minStock, setMinStock] = useState(String(item.minStock))
  const [unit, setUnit] = useState(item.unit)
  const [saving, setSaving] = useState(false)
  const dirty =
    String(item.stock) !== stock ||
    String(item.minStock) !== minStock ||
    item.unit !== unit

  async function save() {
    setSaving(true)
    try {
      await put(`/api/inventory/${item.id}`, {
        stock: parseFloat(stock) || 0,
        minStock: parseFloat(minStock) || 0,
        unit,
      })
      toast.success('Inventario actualizado')
      onSaved()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const critical = item.stock < item.minStock

  return (
    <tr className="hover:bg-accent/40 transition-colors">
      <td className="px-4 py-3 font-medium">{item.product?.name || '—'}</td>
      <td className="px-4 py-3">
        <input
          className="input-wellness py-1.5"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          type="number"
          step="0.01"
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="input-wellness py-1.5"
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
          type="number"
          step="0.01"
        />
      </td>
      <td className="px-4 py-3">
        <input
          className="input-wellness py-1.5"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
      </td>
      <td className="px-4 py-3">
        {critical ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full stock-critical">
            <AlertTriangle className="w-3 h-3" /> Stock crítico
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full stock-ok">
            <CheckCircle2 className="w-3 h-3" /> OK
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          className="btn-sage text-xs px-3 py-1.5 disabled:opacity-50"
          disabled={!dirty || saving}
          onClick={save}
        >
          <Save className="w-3.5 h-3.5" /> {saving ? '…' : 'Guardar'}
        </button>
      </td>
    </tr>
  )
}
