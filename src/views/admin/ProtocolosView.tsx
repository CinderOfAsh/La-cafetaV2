'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Save, ClipboardList, Soup, FileText } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { BookmarkTabs, Card, ModalShell, Badge, LoadingBlock, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { get, post, put, del } from '@/lib/api'
import { toast } from 'sonner'
import type { Protocol, ProtocolType, Product } from '@/lib/types'

export function ProtocolosView() {
  const setView = useAppStore((s) => s.setView)
  const [tab, setTab] = useState<'apertura' | 'cocina' | 'producto'>('apertura')
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Protocol | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, prods] = await Promise.all([
        get<Protocol[]>('/api/protocols'),
        get<Product[]>('/api/products'),
      ])
      setProtocols(p)
      setProducts(prods)
    } catch {
      toast.error('No se pudieron cargar los protocolos')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const tabConfig: { id: 'apertura' | 'cocina' | 'producto'; types: ProtocolType[]; label: string }[] = [
    { id: 'apertura', types: ['APERTURA', 'CIERRE'], label: 'Apertura y Cierre' },
    { id: 'cocina', types: ['COCINA'], label: 'Cocina' },
    { id: 'producto', types: ['PRODUCTO'], label: 'Producto' },
  ]
  const activeConfig = tabConfig.find((t) => t.id === tab)!
  const filtered = protocols.filter((p) => activeConfig.types.includes(p.type))
  const counts = useMemo(() => {
    return {
      apertura: protocols.filter((p) => p.type === 'APERTURA' || p.type === 'CIERRE').length,
      cocina: protocols.filter((p) => p.type === 'COCINA').length,
      producto: protocols.filter((p) => p.type === 'PRODUCTO').length,
    }
  }, [protocols])

  return (
    <>
      <AppHeader title="Protocolos" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookmarkTabs
          active={tab}
          onChange={(id) => setTab(id as 'apertura' | 'cocina' | 'producto')}
          tabs={[
            { id: 'apertura', label: 'Apertura y Cierre', badge: counts.apertura },
            { id: 'cocina', label: 'Cocina', badge: counts.cocina },
            { id: 'producto', label: 'Producto', badge: counts.producto },
          ]}
        />

        <div className="flex justify-end mb-4">
          <button className="btn-sage text-sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Nuevo protocolo
          </button>
        </div>

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <LoadingBlock label="Cargando protocolos…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-6 h-6" />}
              title="Sin protocolos"
              description={`Crea un protocolo de tipo ${activeConfig.types.join(' o ')}.`}
            />
          ) : (
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Nombre</th>
                    <th className="text-left font-medium px-4 py-3">Tipo</th>
                    <th className="text-left font-medium px-4 py-3">Producto</th>
                    <th className="text-left font-medium px-4 py-3">Pasos</th>
                    <th className="text-right font-medium px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.type === 'CIERRE' ? 'warn' : 'sage'}>{p.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.productId ? products.find((x) => x.id === p.productId)?.name || '—' : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{(p.steps || []).length}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button className="btn-ghost p-2" onClick={() => setEditing(p)} aria-label="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                            onClick={async () => {
                              if (!confirm(`¿Eliminar "${p.name}"?`)) return
                              try {
                                await del(`/api/protocols/${p.id}`)
                                toast.success('Protocolo eliminado')
                                load()
                              } catch {
                                toast.error('No se pudo eliminar')
                              }
                            }}
                            aria-label="Eliminar"
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
          <ProtocolDialog
            protocol={editing}
            defaultType={activeConfig.types[0]}
            products={products}
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
      </main>
    </>
  )
}

function ProtocolDialog({
  protocol,
  defaultType,
  products,
  onClose,
  onSaved,
}: {
  protocol: Protocol | null
  defaultType: ProtocolType
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!protocol
  const [type, setType] = useState<ProtocolType>(protocol?.type ?? defaultType)
  const [name, setName] = useState(protocol?.name ?? '')
  const [description, setDescription] = useState(protocol?.description ?? '')
  const [steps, setSteps] = useState((protocol?.steps || []).join('\n'))
  const [productId, setProductId] = useState(protocol?.productId ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim() || !type) {
      toast.error('Nombre y tipo son obligatorios')
      return
    }
    setSaving(true)
    try {
      const body = {
        type,
        name: name.trim(),
        description: description || null,
        steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
        productId: type === 'PRODUCTO' ? productId || undefined : undefined,
      }
      if (isEdit && protocol) {
        await put(`/api/protocols/${protocol.id}`, body)
        toast.success('Protocolo actualizado')
      } else {
        await post('/api/protocols', body)
        toast.success('Protocolo creado')
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
      title={isEdit ? 'Editar protocolo' : 'Nuevo protocolo'}
      size="lg"
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
        <div>
          <label className="text-sm font-medium block mb-1.5">Tipo *</label>
          <select className="input-wellness" value={type} onChange={(e) => setType(e.target.value as ProtocolType)}>
            <option value="APERTURA">APERTURA</option>
            <option value="CIERRE">CIERRE</option>
            <option value="COCINA">COCINA</option>
            <option value="PRODUCTO">PRODUCTO</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Nombre *</label>
          <input className="input-wellness" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Descripción</label>
          <input className="input-wellness" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {type === 'PRODUCTO' && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1.5">Producto asociado</label>
            <select className="input-wellness" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— Sin producto —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1.5">Pasos (uno por línea)</label>
          <textarea
            className="input-wellness min-h-[180px] resize-y font-mono text-xs"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={'Encender luces\nRevisar stock\n...'}
          />
        </div>
      </div>
    </ModalShell>
  )
}

// Avoid unused import warnings
void Soup
void FileText
