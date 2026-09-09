'use client'

import { ReactNode, useState, useRef } from 'react'
import { LoadingBlock, EmptyState, Spinner, PageHeader } from '@/components/ui-bits'
import { Plus, X, GripVertical } from 'lucide-react'

export { LoadingBlock, EmptyState, Spinner, PageHeader }

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Bromas del usuario que SIEMPRE van al final del desplegable, sin importar
// el orden alfabético.
export const TAG_JOKES = ['Agua Bendita', 'HUGO', 'ADRI', 'AITANA', 'NIÑOS']

// =====================================================================
// PACKS — definiciones de los productos hijos que el POS pregunta
// al vender un pack. Cada pack tiene una lista de "grupos" (categorías
// que el user debe elegir, ej: "Bocata", "Refresco") y cada grupo tiene
// las opciones válidas (productos reales con su id en BD).
// =====================================================================
export interface PackOption {
  productId: string         // id del producto hijo en la BD
  productName: string       // nombre legible (cacheado, no se busca en cada render)
  category: string          // etiqueta del modal (no se usa en el filtro)
}
export const PACK_DEFINITIONS: Record<string, { prompt: string; groups: { title: string; options: PackOption[] }[] }> = {
  'Pack TLS': {
    prompt: '¿Qué incluye el Pack TLS?',
    groups: [
      { title: 'Comida (Pincho)', options: [
        { productId: '__PLACEHOLDER__Pincho tortilla', productName: 'Pincho tortilla', category: 'Pincho' },
      ]},
      { title: 'Bebida (Café o Refresco)', options: [
        { productId: '__PLACEHOLDER__Café con leche pequeño', productName: 'Café con leche pequeño', category: 'Café' },
        { productId: '__PLACEHOLDER__Coca-Cola', productName: 'Coca-Cola', category: 'Refresco' },
      ]},
    ],
  },
  'Pack Leny': {
    prompt: '¿Qué incluye el Pack Leny?',
    groups: [
      { title: 'Comida (Gofre)', options: [
        { productId: '__PLACEHOLDER__Gofre', productName: 'Gofre', category: 'Gofre' },
        { productId: '__PLACEHOLDER__Gofre de chocolate', productName: 'Gofre de chocolate', category: 'Gofre' },
      ]},
      { title: 'Bebida (Café)', options: [
        { productId: '__PLACEHOLDER__Café con leche pequeño', productName: 'Café con leche pequeño', category: 'Café' },
      ]},
    ],
  },
  'Pack LEINN': {
    prompt: '¿Qué incluye el Pack LEINN?',
    groups: [
      { title: 'Bocata', options: [
        { productId: '__PLACEHOLDER__Bocata lomo y queso', productName: 'Bocata lomo y queso', category: 'Bocata' },
        { productId: '__PLACEHOLDER__Bocata jamón', productName: 'Bocata jamón', category: 'Bocata' },
        { productId: '__PLACEHOLDER__Bocata tortilla', productName: 'Bocata tortilla', category: 'Bocata' },
        { productId: '__PLACEHOLDER__Sandwich pavo y queso', productName: 'Sandwich pavo y queso', category: 'Bocata' },
      ]},
      { title: 'Refresco', options: [
        { productId: '__PLACEHOLDER__Coca-Cola', productName: 'Coca-Cola', category: 'Refresco' },
        { productId: '__PLACEHOLDER__Coca-Cola Zero', productName: 'Coca-Cola Zero', category: 'Refresco' },
        { productId: '__PLACEHOLDER__Fanta de naranja', productName: 'Fanta de naranja', category: 'Refresco' },
        { productId: '__PLACEHOLDER__Nestea', productName: 'Nestea', category: 'Refresco' },
        { productId: '__PLACEHOLDER__Aquarius de limón', productName: 'Aquarius de limón', category: 'Refresco' },
      ]},
    ],
  },
  'Pack Bakr': {
    prompt: '¿Qué incluye el Pack Bakr?',
    groups: [
      { title: 'Café', options: [
        { productId: '__PLACEHOLDER__Café con leche pequeño', productName: 'Café con leche pequeño', category: 'Café' },
        { productId: '__PLACEHOLDER__Café solo pequeño', productName: 'Café solo pequeño', category: 'Café' },
      ]},
      { title: 'Sándwich', options: [
        { productId: '__PLACEHOLDER__Sandwich pavo y queso', productName: 'Sandwich pavo y queso', category: 'Sándwich' },
        { productId: '__PLACEHOLDER__Croissant pavo y queso', productName: 'Croissant pavo y queso', category: 'Sándwich' },
      ]},
    ],
  },
}

export interface BookmarkTab {
  id: string
  label: string
  badge?: number | string
}

export function BookmarkTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: BookmarkTab[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="bookmark-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`bookmark-tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.badge !== undefined && t.badge !== 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs rounded-full bg-accent text-sage font-semibold">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// POS tag tabs: solo 2 fijas ("Comida", "Bebida") + drag & drop para reordenar
// + botón [+] que abre desplegable con todos los demás tags (ordenados
// alfabéticamente con las bromas al final). El usuario puede añadir un tag
// del desplegable y se cierra automáticamente. Todo se persiste en localStorage.
//
// Props:
//   allTags:         todas las etiquetas que existen en los productos
//   visibleOrder:    array de tags actualmente visibles (en el orden que el user ha elegido)
//                    incluye siempre Comida y Bebida
//   activeTags:      etiquetas que están activas como filtro
//   onToggle(tag):   activa/desactiva una etiqueta
//   onReorder(tags): cambia el orden (drag & drop)
//   onAddFromHidden(tag): añade una etiqueta del desplegable a las visibles
export function TagTabsMulti({
  allTags,
  visibleOrder,
  activeTags,
  onToggle,
  onReorder,
  onAddFromHidden,
  onRemoveVisible,
}: {
  allTags: string[]
  visibleOrder: string[]
  activeTags: string[]
  onToggle: (tag: string) => void
  onReorder: (tags: string[]) => void
  onAddFromHidden: (tag: string) => void
  onRemoveVisible: (tag: string) => void
}) {
  const [open, setOpen] = useState(false)
  // Referencia al wrapper relativo del boton + y al menu desplegable.
  // Los usamos para chequear hover con setTimeout y dar margen al cursor.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Timer id del cierre pendiente (para cancelar si el cursor vuelve a entrar)
  const closeTimerRef = useRef<number | null>(null)

  // Tags ocultos: los que existen pero el user no ha añadido a las visibles.
  // Orden: alfabético, pero las bromas al final.
  const visibleSet = new Set(visibleOrder)
  const hidden = allTags.filter((t) => !visibleSet.has(t))
  const hiddenNormal = hidden.filter((t) => !TAG_JOKES.includes(t)).sort()
  const hiddenJokes = TAG_JOKES.filter((t) => hidden.includes(t))
  const hiddenOrdered = [...hiddenNormal, ...hiddenJokes]

  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldI = visibleOrder.indexOf(active.id as string)
    const newI = visibleOrder.indexOf(over.id as string)
    if (oldI === -1 || newI === -1) return
    onReorder(arrayMove(visibleOrder, oldI, newI))
  }

  function handleAdd(tag: string) {
    // El menú NO se cierra automáticamente: el user puede añadir varios
    // tags a la vez. Solo se cierra al sacar el cursor del menú (onMouseLeave).
    onAddFromHidden(tag)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visibleOrder} strategy={horizontalListSortingStrategy}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {visibleOrder.map((tag) => (
            <SortableTag
              key={tag}
              tag={tag}
              active={activeTags.includes(tag)}
              onToggle={() => onToggle(tag)}
              onRemove={tag === 'Comida' || tag === 'Bebida' ? undefined : () => onRemoveVisible(tag)}
            />
          ))}
          {/* Botón + — siempre a la derecha del todo, fijo (no draggable).
              Usa un setTimeout para NO cerrar instantáneamente: si el cursor
              vuelve a entrar al wrapper o al menú dentro de 200ms, cancelamos
              el cierre. Esto da margen para trayectorias diagonales rápidas. */}
          <div
            ref={wrapperRef}
            className="relative"
            onMouseLeave={() => {
              // Programa el cierre dentro de 200ms. Si en ese tiempo el cursor
              // vuelve a entrar al wrapper o al menú, cancelamos.
              if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
              closeTimerRef.current = window.setTimeout(() => {
                const wrapperHover = wrapperRef.current?.matches(':hover')
                const menuHover = menuRef.current?.matches(':hover')
                if (!wrapperHover && !menuHover) setOpen(false)
              }, 200)
            }}
            onMouseEnter={() => {
              // Si el cursor vuelve al wrapper, cancela cualquier cierre pendiente
              if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
              }
            }}
          >
            {/* Contenedor interno que contiene el botón y un puente invisible
                cuando el menú está abierto. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Añadir etiqueta"
              className="bookmark-tab add-tag"
              title="Añadir etiqueta"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {open && (
              <div className="h-2" aria-hidden />
            )}
            {open && (
              <div
                ref={menuRef}
                onMouseEnter={() => {
                  if (closeTimerRef.current) {
                    window.clearTimeout(closeTimerRef.current)
                    closeTimerRef.current = null
                  }
                }}
                onMouseLeave={() => {
                  if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
                  closeTimerRef.current = window.setTimeout(() => {
                    const wrapperHover = wrapperRef.current?.matches(':hover')
                    const menuHover = menuRef.current?.matches(':hover')
                    if (!wrapperHover && !menuHover) setOpen(false)
                  }, 200)
                }}
                className="absolute z-20 top-full right-0 mt-1 bg-card border border-border rounded-md shadow-lg p-2 min-w-[180px] max-h-72 overflow-y-auto"
                role="menu"
              >
                {hiddenOrdered.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No hay más etiquetas
                  </div>
                ) : (
                  hiddenOrdered.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      role="menuitem"
                      onClick={() => handleAdd(tag)}
                      className={`block w-full text-left px-3 py-1.5 rounded hover:bg-accent text-sm ${
                        TAG_JOKES.includes(tag) ? 'italic text-muted-foreground' : ''
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  )
}

// Componente interno: una pestaña draggable
function SortableTag({
  tag,
  active,
  onToggle,
  onRemove,
}: {
  tag: string
  active: boolean
  onToggle: () => void
  onRemove?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onToggle}
        className={`bookmark-tab flex items-center gap-1 ${active ? 'active' : ''}`}
        {...listeners}
        {...Object.fromEntries(Object.entries(attributes).filter(([k]) => k !== 'role'))}
      >
        <GripVertical className="w-3 h-3 opacity-50" />
        {tag}
        {onRemove && (
          <span
            role="button"
            tabIndex={-1}
            aria-label={`Quitar etiqueta ${tag}`}
            className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded hover:bg-[rgba(0,0,0,0.1)] text-xs leading-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            ×
          </span>
        )}
      </button>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-wellness p-5 sm:p-6 ${className}`}>{children}</div>
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-md">
      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-wellness pl-10"
      />
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode
  variant?: 'default' | 'sage' | 'warn' | 'muted'
  className?: string
}) {
  const styles: Record<string, string> = {
    default: 'bg-accent text-foreground',
    sage: 'bg-[rgba(127,166,155,0.15)] text-sage',
    warn: 'bg-[rgba(199,123,92,0.15)] text-[color:var(--warn)]',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function KVEditor({
  value,
  onChange,
  label = 'Campos personalizados',
}: {
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
  label?: string
}) {
  const entries = Object.entries(value)
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="space-y-2">
        {entries.map(([k, v], idx) => (
          <div key={idx} className="flex gap-2">
            <input
              className="input-wellness flex-1"
              value={k}
              onChange={(e) => {
                const next = { ...value }
                delete next[k]
                next[e.target.value] = v
                onChange(next)
              }}
              placeholder="clave"
            />
            <input
              className="input-wellness flex-1"
              value={v}
              onChange={(e) => {
                onChange({ ...value, [k]: e.target.value })
              }}
              placeholder="valor"
            />
            <button
              type="button"
              className="btn-ghost p-2 text-muted-foreground hover:text-[color:var(--warn)]"
              onClick={() => {
                const next = { ...value }
                delete next[k]
                onChange(next)
              }}
              aria-label="Eliminar"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-ghost text-sm mt-2"
        onClick={() => onChange({ ...value, [`campo_${Object.keys(value).length + 1}`]: '' })}
      >
        + Añadir campo
      </button>
    </div>
  )
}

export function ModalShell({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizes: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-card border border-border rounded-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col shadow-xl animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-border">
          <div className="min-w-0">
            <h2 className="font-serif text-xl text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            className="btn-ghost p-2 -mt-1 -mr-1 shrink-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scroll p-5 sm:p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 p-5 sm:p-6 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
