'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  Users,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Save,
} from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { BookmarkTabs, Card, ModalShell, Toolbar, Badge, KVEditor } from '@/components/shared'
import { LoadingBlock, EmptyState } from '@/components/ui-bits'
import { useAppStore } from '@/lib/store'
import { get, post, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { downloadCsv } from '@/lib/export-csv'
import { formatDate, DOW_LABELS, parseDays } from '@/lib/format'
import type { Shift, Role } from '@/lib/types'

// DB user shape
interface DbUser {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  customFields: Record<string, string>
  createdAt: string
}

export function PersonalView() {
  const setView = useAppStore((s) => s.setView)
  const [tab, setTab] = useState<'empleados' | 'turnos'>('empleados')

  return (
    <>
      <AppHeader title="Gestión de Personal" onBack={() => setView('hub-admin')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookmarkTabs
          active={tab}
          onChange={(id) => setTab(id as 'empleados' | 'turnos')}
          tabs={[
            { id: 'empleados', label: 'Empleados' },
            { id: 'turnos', label: 'Turnos' },
          ]}
        />
        {tab === 'empleados' && <EmpleadosTab />}
        {tab === 'turnos' && <TurnosTab />}
      </main>
    </>
  )
}

// ---------- Empleados ----------

function EmpleadosTab() {
  const setView = useAppStore((s) => s.setView)
  const setSelectedUserId = useAppStore((s) => s.setSelectedUserId)
  const [items, setItems] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<DbUser | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await get<DbUser[]>('/api/users')
      setItems(data)
    } catch {
      toast.error('No se pudieron cargar los usuarios')
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
    return items.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [items, search])

  function exportCsv() {
    const rows = items.map((u) => ({
      id: u.id,
      nombre: u.name,
      email: u.email,
      rol: u.role,
      activo: u.isActive ? 'sí' : 'no',
      creado: formatDate(u.createdAt),
    }))
    downloadCsv(rows, 'empleados.csv')
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
            placeholder="Buscar empleado…"
            className="input-wellness pl-10"
          />
        </div>
        <button className="btn-outline text-sm" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button className="btn-sage text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Nuevo empleado
        </button>
      </Toolbar>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingBlock label="Cargando empleados…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-6 h-6" />} title="Sin empleados" description="No hay empleados que coincidan." />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nombre</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Rol</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="text-left font-medium px-4 py-3">Creado</th>
                  <th className="text-right font-medium px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'sage' : 'muted'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <Badge variant="sage">Activo</Badge>
                      ) : (
                        <Badge variant="warn">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap gap-1 justify-end">
                        <button
                          className="btn-ghost p-2 text-xs"
                          onClick={() => {
                            setSelectedUserId(u.id)
                            setView('admin-asignar')
                          }}
                          aria-label={`Asignar turnos a ${u.name}`}
                          title="Asignar turnos"
                        >
                          <CalendarDays className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-2"
                          onClick={() => setEditing(u)}
                          aria-label={`Editar ${u.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar a "${u.name}"?`)) return
                            try {
                              await del(`/api/users/${u.id}`)
                              toast.success('Usuario eliminado')
                              load()
                            } catch {
                              toast.error('No se pudo eliminar')
                            }
                          }}
                          aria-label={`Eliminar ${u.name}`}
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
        <UserDialog
          user={editing}
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

function UserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: DbUser | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!user
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(user?.role ?? 'EMPLOYEE')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [customFields, setCustomFields] = useState<Record<string, string>>(user?.customFields || {})
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim() || !email.trim()) {
      toast.error('Nombre y email son obligatorios')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        role,
        isActive,
        customFields,
      }
      if (password) body.password = password
      if (isEdit && user) {
        await put(`/api/users/${user.id}`, body)
        toast.success('Usuario actualizado')
      } else {
        if (!password) {
          toast.error('La contraseña es obligatoria al crear')
          setSaving(false)
          return
        }
        await post('/api/users', body)
        toast.success('Usuario creado')
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
      title={isEdit ? 'Editar empleado' : 'Nuevo empleado'}
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
        <div>
          <label className="text-sm font-medium block mb-1.5">Nombre *</label>
          <input className="input-wellness" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Email *</label>
          <input className="input-wellness" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Contraseña {isEdit && '(dejar vacío para mantener)'}</label>
          <input
            className="input-wellness"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? '••••••' : 'Contraseña inicial'}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Rol</label>
          <select className="input-wellness" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="ADMIN">ADMIN</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="COCINERO">COCINERO</option>
            <option value="ANOTADOR">ANOTADOR</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[color:var(--sage)]"
            />
            <span className="text-sm">Usuario activo</span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <KVEditor value={customFields} onChange={setCustomFields} />
        </div>
      </div>
    </ModalShell>
  )
}

// ---------- Turnos ----------

function TurnosTab() {
  const [items, setItems] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Shift | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await get<Shift[]>('/api/shifts')
      setItems(data)
    } catch {
      toast.error('No se pudieron cargar los turnos')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <Toolbar>
        <div className="flex-1" />
        <button className="btn-sage text-sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> Nuevo turno
        </button>
      </Toolbar>

      {loading ? (
        <Card><LoadingBlock label="Cargando turnos…" /></Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={<Clock className="w-6 h-6" />} title="Sin turnos" description="Crea el primer turno." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => {
            const days = parseDays(s.daysOfWeek)
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {s.startTime} – {s.endTime}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-1.5" onClick={() => setEditing(s)} aria-label="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="btn-ghost p-1.5 text-muted-foreground hover:text-[color:var(--warn)]"
                      onClick={async () => {
                        if (!confirm(`¿Eliminar turno "${s.name}"?`)) return
                        try {
                          await del(`/api/shifts/${s.id}`)
                          toast.success('Turno eliminado')
                          load()
                        } catch {
                          toast.error('No se pudo eliminar')
                        }
                      }}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {DOW_LABELS.map((d, idx) => (
                    <span
                      key={idx}
                      className={`w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-medium ${
                        days.includes(idx) ? 'bg-[color:var(--sage)] text-[color:var(--sage-foreground)]' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{(s.openingProtocol || []).length}</span> pasos apertura ·{' '}
                  <span className="font-medium text-foreground">{(s.closingProtocol || []).length}</span> pasos cierre
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {(creating || editing) && (
        <ShiftDialog
          shift={editing}
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

function ShiftDialog({
  shift,
  onClose,
  onSaved,
}: {
  shift: Shift | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!shift
  const [name, setName] = useState(shift?.name ?? '')
  const [startTime, setStartTime] = useState(shift?.startTime ?? '07:00')
  const [endTime, setEndTime] = useState(shift?.endTime ?? '14:00')
  const [days, setDays] = useState<number[]>(parseDays(shift?.daysOfWeek).length ? parseDays(shift?.daysOfWeek) : [1, 2, 3, 4, 5])
  const [openingProtocol, setOpeningProtocol] = useState((shift?.openingProtocol || []).join('\n'))
  const [closingProtocol, setClosingProtocol] = useState((shift?.closingProtocol || []).join('\n'))
  const [saving, setSaving] = useState(false)

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  async function save() {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        startTime,
        endTime,
        daysOfWeek: days.join(','),
        openingProtocol: openingProtocol.split('\n').map((s) => s.trim()).filter(Boolean),
        closingProtocol: closingProtocol.split('\n').map((s) => s.trim()).filter(Boolean),
      }
      if (isEdit && shift) {
        await put(`/api/shifts/${shift.id}`, body)
        toast.success('Turno actualizado')
      } else {
        await post('/api/shifts', body)
        toast.success('Turno creado')
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
      title={isEdit ? 'Editar turno' : 'Nuevo turno'}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="text-sm font-medium block mb-1.5">Nombre *</label>
          <input className="input-wellness" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mañana" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Hora inicio</label>
          <input className="input-wellness" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Hora fin</label>
          <input className="input-wellness" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <label className="text-sm font-medium block mb-1.5">Días de la semana</label>
          <div className="flex gap-1.5">
            {DOW_LABELS.map((d, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                  days.includes(idx)
                    ? 'bg-[color:var(--sage)] text-[color:var(--sage-foreground)]'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-3">
          <label className="text-sm font-medium block mb-1.5">Protocolo de apertura (un paso por línea)</label>
          <textarea
            className="input-wellness min-h-[120px] resize-y font-mono text-xs"
            value={openingProtocol}
            onChange={(e) => setOpeningProtocol(e.target.value)}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-sm font-medium block mb-1.5">Protocolo de cierre (un paso por línea)</label>
          <textarea
            className="input-wellness min-h-[120px] resize-y font-mono text-xs"
            value={closingProtocol}
            onChange={(e) => setClosingProtocol(e.target.value)}
          />
        </div>
      </div>
    </ModalShell>
  )
}

// (Deudas eliminado — se retomará más adelante)

// Avoid TS unused warnings for imports
