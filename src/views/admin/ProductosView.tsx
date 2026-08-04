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
  ShoppingCart,
  Trash,
  Upload,
  FileText,
  RotateCcw,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { BookmarkTabs, Card, ModalShell, Toolbar, Badge, KVEditor } from '@/components/shared'
import { LoadingBlock, EmptyState } from '@/components/ui-bits'
import { useAppStore } from '@/lib/store'
import { get, post, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { eur, localDateStr } from '@/lib/format'
import type { Product, RawMaterial, ProductRecipe, Purchase, PurchaseItem } from '@/lib/types'

type Tab = 'productos' | 'materias' | 'lista-compra' | 'compras'

export function ProductosView() {
  const setView = useAppStore((s) => s.setView)
  const [tab, setTab] = useState<Tab>('productos')
  // Shared refresh key so actions in one tab can signal others
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)

  return (
    <>
      <AppHeader title="Productos" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookmarkTabs
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: 'productos', label: 'Productos' },
            { id: 'materias', label: 'Materias Primas' },
            { id: 'lista-compra', label: 'Lista de la Compra' },
            { id: 'compras', label: 'Compras' },
          ]}
        />
        {tab === 'productos' && <ProductosTab key={`p-${refreshKey}`} />}
        {tab === 'materias' && <MateriasTab key={`m-${refreshKey}`} />}
        {tab === 'lista-compra' && <ListaCompraTab key={`lc-${refreshKey}`} onPurchased={refresh} />}
        {tab === 'compras' && <ComprasTab key={`c-${refreshKey}`} onChanged={refresh} />}
      </main>
    </>
  )
}

// ==================== PRODUCTOS ====================

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
      ingredientes: (p.recipes || []).map((r) => `${r.rawMaterial?.name || ''}×${r.quantity}${r.rawMaterial?.unit || ''}`).join(' + '),
      activo: p.isActive ? 'sí' : 'no',
    }))
    downloadCsv(rows, 'productos.csv')
    toast.success('CSV descargado')
  }

  return (
    <div>
      <Toolbar>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="input-wellness pl-10 pr-9"
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
            description="No hay productos que coincidan con la búsqueda. Crea el primero con «Nuevo producto»."
          />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nombre</th>
                  <th className="text-left font-medium px-4 py-3">Precio</th>
                  <th className="text-left font-medium px-4 py-3">Etiquetas</th>
                  <th className="text-left font-medium px-4 py-3">Composición</th>
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
                          <Badge key={t} variant="muted">{t}</Badge>
                        ))}
                        {(p.tags || []).length > 3 && (
                          <Badge variant="muted">+{p.tags.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {(p.recipes || []).length === 0
                        ? <span className="italic">sin receta</span>
                        : (p.recipes || []).slice(0, 3).map((r, i) => (
                            <span key={r.id}>
                              {i > 0 && ' + '}
                              {r.rawMaterial?.name} ×{r.quantity}{r.rawMaterial?.unit}
                            </span>
                          ))}
                      {(p.recipes || []).length > 3 && (
                        <span className="text-muted-foreground"> +{p.recipes.length - 3} más</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <Badge variant="sage"><CheckCircle2 className="w-3 h-3" /> Activo</Badge>
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
  // Recipe state — array of {rawMaterialId, quantity}
  const [recipes, setRecipes] = useState<Array<{ rawMaterialId: string; quantity: number }>>(
    (product?.recipes || []).map((r) => ({ rawMaterialId: r.rawMaterialId, quantity: r.quantity }))
  )
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [saving, setSaving] = useState(false)
  // Inline new material creation
  const [showNewMaterialRow, setShowNewMaterialRow] = useState(false)
  const [newMaterial, setNewMaterial] = useState<{ name: string; unit: string; stock: string; minStock: string }>({
    name: '', unit: 'ud', stock: '0', minStock: '0',
  })

  useEffect(() => {
    get<RawMaterial[]>('/api/raw-materials')
      .then(setMaterials)
      .catch(() => toast.error('No se pudieron cargar las materias primas'))
  }, [])

  function addRecipe() {
    if (materials.length === 0) {
      // No hay materias — abrir el formulario de creación inline
      setShowNewMaterialRow(true)
      toast.info('No hay materias primas. Crea la primera aquí.')
      return
    }
    setRecipes([...recipes, { rawMaterialId: materials[0].id, quantity: 1 }])
  }

  function updateRecipe(idx: number, field: 'rawMaterialId' | 'quantity', value: string) {
    setRecipes(
      recipes.map((r, i) =>
        i === idx
          ? { ...r, [field]: field === 'quantity' ? Number(value) : value }
          : r
      )
    )
  }

  function removeRecipe(idx: number) {
    setRecipes(recipes.filter((_, i) => i !== idx))
  }

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
      recipes: recipes.filter((r) => r.rawMaterialId && r.quantity > 0),
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

  // Compute cost estimate from recipes
  const costEstimate = recipes.reduce((sum, r) => {
    const mat = materials.find((m) => m.id === r.rawMaterialId)
    return sum + (mat ? 0 : 0) // we don't have unit price on material; purchases track that
  }, 0)
  void costEstimate

  return (
    <ModalShell
      open
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      description={isEdit ? product?.name : 'Rellena los campos para crear el producto.'}
      size="xl"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>Cancelar</button>
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
            placeholder="https://ejemplo.com/foto.jpg o /uploads/cafe.jpg"
          />
          {imageUrl && (
            <div className="mt-2 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent && !parent.querySelector('.fallback-icon')) {
                      const span = document.createElement('span')
                      span.className = 'fallback-icon text-xs text-muted-foreground'
                      span.textContent = 'error'
                      parent.appendChild(span)
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Vista previa. Si no carga, la URL puede no ser accesible.
              </p>
            </div>
          )}
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

        {/* Recipe editor */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-medium block">Composición (materias primas)</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define qué materias primas componen este producto y en qué cantidad. Al venderse, se descuenta automáticamente del stock.
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => setShowNewMaterialRow(true)}
                title="Crear nueva materia prima"
              >
                <Plus className="w-3.5 h-3.5" /> Crear materia
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={addRecipe}>
                <Plus className="w-3.5 h-3.5" /> Añadir ingrediente
              </button>
            </div>
          </div>

          {/* Inline new material creation */}
          {showNewMaterialRow && (
            <div className="mb-3 p-3 rounded-lg border border-[color:var(--sage)] bg-accent">
              <p className="text-xs font-medium text-sage mb-2">Crear nueva materia prima</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  className="input-wellness"
                  placeholder="Nombre *"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
                <input
                  className="input-wellness"
                  placeholder="Unidad (ud, kg, g...)"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                />
                <input
                  className="input-wellness"
                  type="number"
                  step="0.01"
                  placeholder="Stock inicial"
                  value={newMaterial.stock}
                  onChange={(e) => setNewMaterial({ ...newMaterial, stock: e.target.value })}
                />
                <input
                  className="input-wellness"
                  type="number"
                  step="0.01"
                  placeholder="Mínimo alerta"
                  value={newMaterial.minStock}
                  onChange={(e) => setNewMaterial({ ...newMaterial, minStock: e.target.value })}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn-sage text-xs"
                  onClick={async () => {
                    if (!newMaterial.name.trim()) {
                      toast.error('El nombre es obligatorio')
                      return
                    }
                    try {
                      const created = await post<RawMaterial>('/api/raw-materials', {
                        name: newMaterial.name.trim(),
                        unit: newMaterial.unit.trim() || 'ud',
                        stock: parseFloat(newMaterial.stock) || 0,
                        minStock: parseFloat(newMaterial.minStock) || 0,
                      })
                      setMaterials([...materials, created])
                      // Auto-add to recipes
                      setRecipes([...recipes, { rawMaterialId: created.id, quantity: 1 }])
                      setNewMaterial({ name: '', unit: 'ud', stock: '0', minStock: '0' })
                      setShowNewMaterialRow(false)
                      toast.success(`Materia prima "${created.name}" creada y añadida a la receta`)
                    } catch {
                      toast.error('No se pudo crear la materia prima')
                    }
                  }}
                >
                  <Save className="w-3.5 h-3.5" /> Crear y añadir
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => {
                    setShowNewMaterialRow(false)
                    setNewMaterial({ name: '', unit: 'ud', stock: '0', minStock: '0' })
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {recipes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Sin ingredientes. Añade las materias primas que componen este producto, o crea una nueva con el botón de arriba.
            </div>
          ) : (
            <div className="space-y-2">
              {recipes.map((r, idx) => {
                const mat = materials.find((m) => m.id === r.rawMaterialId)
                return (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className="input-wellness flex-1"
                      value={r.rawMaterialId}
                      onChange={(e) => updateRecipe(idx, 'rawMaterialId', e.target.value)}
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit}) — stock: {m.stock}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input-wellness w-28"
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.quantity}
                      onChange={(e) => updateRecipe(idx, 'quantity', e.target.value)}
                      placeholder="Cant."
                    />
                    <span className="text-xs text-muted-foreground w-12 shrink-0">
                      {mat?.unit || ''}
                    </span>
                    <button
                      type="button"
                      className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                      onClick={() => removeRecipe(idx)}
                      aria-label="Quitar ingrediente"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <KVEditor value={customFields} onChange={setCustomFields} />
        </div>
      </div>
    </ModalShell>
  )
}

// ==================== MATERIAS PRIMAS ====================

function MateriasTab() {
  const [items, setItems] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<RawMaterial | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await get<RawMaterial[]>('/api/raw-materials')
      setItems(data)
    } catch {
      toast.error('No se pudieron cargar las materias primas')
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
    return items.filter((m) => m.name.toLowerCase().includes(q))
  }, [items, search])

  function exportCsv() {
    const rows = items.map((m) => ({
      nombre: m.name,
      stock: m.stock,
      minStock: m.minStock,
      unidad: m.unit,
      estado: m.stock < m.minStock ? 'crítico' : 'ok',
    }))
    downloadCsv(rows, 'materias_primas.csv')
    toast.success('CSV descargado')
  }

  return (
    <div>
      <Toolbar>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar materia prima…"
            className="input-wellness pl-10"
          />
        </div>
        <button className="btn-outline text-sm" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button className="btn-sage text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Nueva materia
        </button>
      </Toolbar>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingBlock label="Cargando materias primas…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="w-6 h-6" />}
            title="Sin materias primas"
            description="Crea la primera materia prima (pan, lomo, queso, plato, servilleta, etc.)."
          />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Materia prima</th>
                  <th className="text-left font-medium px-4 py-3 w-32">Stock</th>
                  <th className="text-left font-medium px-4 py-3 w-32">Mínimo</th>
                  <th className="text-left font-medium px-4 py-3 w-24">Unidad</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-medium px-4 py-3 w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">
                      <span className={m.stock < m.minStock ? 'text-[color:var(--warn)] font-medium' : ''}>
                        {m.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.minStock}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                    <td className="px-4 py-3">
                      {m.stock < m.minStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full stock-critical">
                          <AlertTriangle className="w-3 h-3" /> Crítico
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full stock-ok">
                          <CheckCircle2 className="w-3 h-3" /> OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          className="btn-ghost p-2"
                          onClick={() => setEditing(m)}
                          aria-label={`Editar ${m.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar "${m.name}"?`)) return
                            try {
                              await del(`/api/raw-materials/${m.id}`)
                              toast.success('Materia prima eliminada')
                              load()
                            } catch (e: any) {
                              toast.error(e.message || 'No se pudo eliminar')
                            }
                          }}
                          aria-label={`Eliminar ${m.name}`}
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
        <MaterialDialog
          material={editing}
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

function MaterialDialog({
  material,
  onClose,
  onSaved,
}: {
  material: RawMaterial | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!material
  const [name, setName] = useState(material?.name ?? '')
  const [unit, setUnit] = useState(material?.unit ?? 'ud')
  const [stock, setStock] = useState(String(material?.stock ?? '0'))
  const [minStock, setMinStock] = useState(String(material?.minStock ?? '0'))
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) {
      toast.error('Nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        unit: unit.trim() || 'ud',
        stock: parseFloat(stock) || 0,
        minStock: parseFloat(minStock) || 0,
      }
      if (isEdit && material) {
        await put(`/api/raw-materials/${material.id}`, body)
        toast.success('Materia prima actualizada')
      } else {
        await post('/api/raw-materials', body)
        toast.success('Materia prima creada')
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
      title={isEdit ? 'Editar materia prima' : 'Nueva materia prima'}
      size="md"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>Cancelar</button>
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
            placeholder="Ej: Barra de pan, Lomo, Queso, Plato, Servilleta"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Unidad</label>
          <input
            className="input-wellness"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="ud, kg, g, L, ml, plato, servilleta…"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Stock actual</label>
          <input
            className="input-wellness"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            type="number"
            step="0.01"
            min="0"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Stock mínimo (alerta)</label>
          <input
            className="input-wellness"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            type="number"
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Cuando el stock baje de este valor, se marcará como crítico.
          </p>
        </div>
      </div>
    </ModalShell>
  )
}


// ==================== LISTA DE LA COMPRA (checklist auto) ====================

function ListaCompraTab({ onPurchased }: { onPurchased: () => void }) {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  // Map of materialId -> { quantity, unitPrice }
  const [inputs, setInputs] = useState<Record<string, { quantity: string; unitPrice: string }>>({})
  // Track which items have been "comprados" in this session (optimistic tachado)
  const [justBought, setJustBought] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await get<RawMaterial[]>('/api/raw-materials')
      setMaterials(data)
    } catch {
      toast.error('No se pudieron cargar las materias primas')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // Shopping list items = materials that are critical OR recently purchased (tachado within 24h)
  const shoppingItems = useMemo(() => {
    return materials
      .filter((m) => m.inShoppingList || (!m.inShoppingList && m.critical) || (m.stock < m.minStock))
      .filter((m) => {
        // If tachado and stock is now OK, still show as tachado until 24h pass
        const lastTs = m.lastPurchasedAt ? new Date(m.lastPurchasedAt).getTime() : 0
        const within24h = lastTs > 0 && Date.now() - lastTs < 24 * 60 * 60 * 1000
        // Show if critical OR within24h
        return m.stock < m.minStock || within24h
      })
  }, [materials])

  function setInput(id: string, field: 'quantity' | 'unitPrice', value: string) {
    setInputs((prev) => ({
      ...prev,
      [id]: { quantity: prev[id]?.quantity || '', unitPrice: prev[id]?.unitPrice || '', [field]: value },
    }))
  }

  async function comprar(m: RawMaterial) {
    const inp = inputs[m.id] || { quantity: '', unitPrice: '' }
    const qty = parseFloat(inp.quantity)
    const price = parseFloat(inp.unitPrice)
    if (!qty || qty <= 0) {
      toast.error('Introduce una cantidad válida')
      return
    }
    if (!price || price < 0) {
      toast.error('Introduce un precio válido')
      return
    }
    setSubmitting(m.id)
    try {
      // Create a Purchase with source="shopping-list", single item
      await post('/api/purchases', {
        source: 'shopping-list',
        items: [{ rawMaterialId: m.id, quantity: qty, unitPrice: price }],
      })
      toast.success(`${m.name} comprado · stock actualizado`)
      setJustBought((prev) => new Set(prev).add(m.id))
      onPurchased()
      await load()
    } catch {
      toast.error('No se pudo registrar la compra')
    } finally {
      setSubmitting(null)
    }
  }

  const totalEstimado = shoppingItems.reduce((s, m) => {
    const inp = inputs[m.id]
    if (inp && inp.quantity && inp.unitPrice) {
      return s + parseFloat(inp.quantity) * parseFloat(inp.unitPrice)
    }
    return s
  }, 0)

  return (
    <div>
      <Toolbar>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Lista automática de materias primas en estado crítico. Introduce la cantidad comprada y el precio para tachar el item.
            Los items tachados desaparecen a las 24h.
          </p>
        </div>
        <button className="btn-outline text-sm" onClick={load}>
          <RotateCcw className="w-4 h-4" /> Actualizar
        </button>
      </Toolbar>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingBlock label="Cargando lista de la compra…" />
        ) : shoppingItems.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-6 h-6" />}
            title="Lista de la compra vacía"
            description="No hay materias primas en estado crítico. Cuando una materia llegue por debajo de su mínimo, aparecerá aquí automáticamente."
          />
        ) : (
          <>
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Materia prima</th>
                    <th className="text-left font-medium px-4 py-3 w-28">Stock actual</th>
                    <th className="text-left font-medium px-4 py-3 w-28">Mínimo</th>
                    <th className="text-left font-medium px-4 py-3 w-32">Cantidad comprada</th>
                    <th className="text-left font-medium px-4 py-3 w-32">Precio (€)</th>
                    <th className="text-right font-medium px-4 py-3 w-32">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shoppingItems.map((m) => {
                    const tachado = justBought.has(m.id) || (m.shoppingTachado ?? false)
                    const inp = inputs[m.id] || { quantity: '', unitPrice: '' }
                    const canBuy = parseFloat(inp.quantity) > 0 && parseFloat(inp.unitPrice) >= 0 && inp.unitPrice !== ''
                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors ${tachado ? 'bg-muted/30 opacity-50' : 'hover:bg-accent/40'}`}
                      >
                        <td className={`px-4 py-3 font-medium ${tachado ? 'line-through' : ''}`}>
                          {m.name}
                          {tachado && (
                            <Badge variant="sage" className="ml-2">
                              <CheckCircle2 className="w-3 h-3" /> comprado
                            </Badge>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-[color:var(--warn)] font-medium ${tachado ? 'line-through' : ''}`}>
                          {m.stock} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.minStock} {m.unit}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-wellness py-1.5"
                            placeholder="Cant."
                            value={inp.quantity}
                            onChange={(e) => setInput(m.id, 'quantity', e.target.value)}
                            disabled={tachado}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-wellness py-1.5"
                            placeholder="€/ud"
                            value={inp.unitPrice}
                            onChange={(e) => setInput(m.id, 'unitPrice', e.target.value)}
                            disabled={tachado}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="btn-sage text-xs px-3 py-1.5"
                            onClick={() => comprar(m)}
                            disabled={tachado || !canBuy || submitting === m.id}
                          >
                            {tachado ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Tachado</>
                            ) : submitting === m.id ? (
                              '…'
                            ) : (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Comprar</>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalEstimado > 0 && (
              <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                <span className="text-sm text-muted-foreground">Total estimado de la compra</span>
                <span className="text-lg font-semibold text-sage">{eur(totalEstimado)}</span>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

// ==================== COMPRAS (historial + conciliación) ====================

function ComprasTab({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'conciliated'>('all')

  async function load() {
    setLoading(true)
    try {
      const data = await get<Purchase[]>('/api/purchases')
      setItems(data)
    } catch {
      toast.error('No se pudieron cargar las compras')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'pending') return items.filter((p) => !p.conciliatedAt)
    if (filter === 'conciliated') return items.filter((p) => p.conciliatedAt)
    return items
  }, [items, filter])

  const totalGastado = items.reduce((s, p) => s + p.totalAmount, 0)
  const totalConciliado = items.filter((p) => p.conciliatedAt).reduce((s, p) => s + p.totalAmount, 0)
  const totalPendiente = totalGastado - totalConciliado

  function exportCsv() {
    const rows: any[] = []
    for (const p of items) {
      for (const it of (p.items || [])) {
        rows.push({
          fecha: new Date(p.date).toLocaleDateString('es-ES'),
          proveedor: p.supplier || '',
          materia: it.rawMaterial?.name || '',
          cantidad: it.quantity,
          unidad: it.rawMaterial?.unit || '',
          precioUnitario: it.unitPrice,
          subtotal: it.subtotal,
          total: p.totalAmount,
          conciliado: p.conciliatedAt ? 'sí' : 'no',
          origen: p.source === 'shopping-list' ? 'lista compra' : 'manual',
        })
      }
    }
    downloadCsv(rows, 'compras.csv')
    toast.success('CSV descargado')
  }

  return (
    <div>
      <Toolbar>
        <div className="flex items-center gap-4 flex-1">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total gastado</p>
            <p className="text-lg font-semibold text-foreground">{eur(totalGastado)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Conciliado</p>
            <p className="text-lg font-semibold text-sage">{eur(totalConciliado)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pendiente</p>
            <p className="text-lg font-semibold text-[color:var(--warn)]">{eur(totalPendiente)}</p>
          </div>
        </div>
        <div className="inline-flex bg-muted/60 rounded-full p-1">
          {([
            ['all', 'Todas'],
            ['pending', 'No conciliado'],
            ['conciliated', 'Conciliado'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === id ? 'bg-card text-sage shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="btn-outline text-sm" onClick={exportCsv} disabled={items.length === 0}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button className="btn-sage text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Registrar compra
        </button>
      </Toolbar>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingBlock label="Cargando compras…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-6 h-6" />}
            title="Sin compras"
            description="Las compras que registres (manualmente o desde la Lista de la Compra) aparecerán aquí. Sube la factura para conciliarlas."
          />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Fecha</th>
                  <th className="text-left font-medium px-4 py-3">Origen</th>
                  <th className="text-left font-medium px-4 py-3">Proveedor</th>
                  <th className="text-left font-medium px-4 py-3">Items</th>
                  <th className="text-left font-medium px-4 py-3">Detalle</th>
                  <th className="text-right font-medium px-4 py-3">Total</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-right font-medium px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const conciliated = !!p.conciliatedAt
                  return (
                    <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.source === 'shopping-list' ? 'sage' : 'muted'}>
                          {p.source === 'shopping-list' ? 'Lista compra' : 'Manual'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{p.supplier || '—'}</td>
                      <td className="px-4 py-3">{(p.items || []).length}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {(p.items || []).slice(0, 3).map((it, i) => (
                          <span key={it.id}>
                            {i > 0 && ', '}
                            {it.rawMaterial?.name} ×{it.quantity}{it.rawMaterial?.unit}
                          </span>
                        ))}
                        {(p.items || []).length > 3 && (
                          <span> +{p.items.length - 3} más</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {eur(p.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {conciliated ? (
                          <Badge variant="sage">
                            <CheckCircle2 className="w-3 h-3" /> Conciliado
                          </Badge>
                        ) : (
                          <Badge variant="warn">
                            <AlertTriangle className="w-3 h-3" /> No conciliado
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          {!conciliated && (
                            <ConciliateButton purchaseId={p.id} onDone={load} />
                          )}
                          {conciliated && p.invoiceUrl && (
                            <a
                              href={p.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-ghost p-2 text-sage"
                              aria-label="Ver factura"
                              title="Ver factura"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                            onClick={async () => {
                              if (!confirm('¿Eliminar esta compra? Se revertirán los incrementos de stock.')) return
                              try {
                                await del(`/api/purchases/${p.id}`)
                                toast.success('Compra eliminada')
                                load()
                                onChanged()
                              } catch {
                                toast.error('No se pudo eliminar')
                              }
                            }}
                            aria-label="Eliminar compra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creating && (
        <PurchaseDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            load()
            onChanged()
          }}
        />
      )}
    </div>
  )
}

function ConciliateButton({ purchaseId, onDone }: { purchaseId: string; onDone: () => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/purchases/${purchaseId}/conciliate`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al subir')
      }
      toast.success('Factura subida · compra conciliada')
      onDone()
    } catch (e: any) {
      toast.error(e.message || 'No se pudo subir la factura')
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="btn-sage text-xs px-3 py-1.5 cursor-pointer">
      <Upload className="w-3.5 h-3.5" /> {uploading ? 'Subiendo…' : 'Subir factura'}
      <input
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

// PurchaseDialog — registro manual de compra (también disponible)
function PurchaseDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(localDateStr(new Date()))
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [items, setItems] = useState<Array<{ rawMaterialId: string; quantity: number; unitPrice: number }>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    get<RawMaterial[]>('/api/raw-materials').then((mats) => {
      setMaterials(mats)
      if (mats.length > 0) {
        setItems([{ rawMaterialId: mats[0].id, quantity: 1, unitPrice: 0 }])
      }
    }).catch(() => toast.error('No se pudieron cargar las materias primas'))
  }, [])

  function addItem() {
    if (materials.length === 0) return
    setItems([...items, { rawMaterialId: materials[0].id, quantity: 1, unitPrice: 0 }])
  }
  function updateItem(idx: number, field: 'rawMaterialId' | 'quantity' | 'unitPrice', value: string) {
    setItems(
      items.map((it, i) =>
        i === idx ? { ...it, [field]: field === 'rawMaterialId' ? value : Number(value) } : it
      )
    )
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)

  async function save() {
    if (items.length === 0) {
      toast.error('Añade al menos un item')
      return
    }
    setSaving(true)
    try {
      await post('/api/purchases', {
        date,
        supplier: supplier || null,
        notes: notes || null,
        source: 'manual',
        items,
      })
      toast.success('Compra registrada · stock actualizado')
      onSaved()
    } catch {
      toast.error('No se pudo registrar la compra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Registrar compra manual"
      description="Introduce la cantidad comprada y el precio. El stock de cada materia se incrementará automáticamente."
      size="xl"
      footer={
        <>
          <button className="btn-ghost text-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-sage text-sm" onClick={save} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Guardando…' : `Registrar · ${eur(total)}`}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Fecha</label>
          <input
            type="date"
            className="input-wellness"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Proveedor (opcional)</label>
          <input
            className="input-wellness"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Ej: Makro, Repsol, panadería local…"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-sm font-medium block mb-1.5">Notas (opcional)</label>
          <input
            className="input-wellness"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones sobre la compra"
          />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium">Items de la compra</label>
        <button type="button" className="btn-ghost text-xs" onClick={addItem}>
          <Plus className="w-3.5 h-3.5" /> Añadir item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Añade items seleccionando materias primas.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <select
                className="input-wellness col-span-5"
                value={it.rawMaterialId}
                onChange={(e) => updateItem(idx, 'rawMaterialId', e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit}) — stock: {m.stock}
                  </option>
                ))}
              </select>
              <input
                className="input-wellness col-span-3"
                type="number"
                step="0.01"
                min="0"
                value={it.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                placeholder="Cant."
              />
              <input
                className="input-wellness col-span-3"
                type="number"
                step="0.01"
                min="0"
                value={it.unitPrice}
                onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                placeholder="Precio €/ud"
              />
              <button
                type="button"
                className="btn-ghost p-2 col-span-1 text-muted-foreground hover:text-[color:var(--warn)]"
                onClick={() => removeItem(idx)}
                aria-label="Quitar item"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total de la compra</span>
        <span className="text-lg font-semibold text-sage">{eur(total)}</span>
      </div>
    </ModalShell>
  )
}

// Avoid TS unused warnings
void (null as unknown as ProductRecipe)
void (null as unknown as PurchaseItem)
