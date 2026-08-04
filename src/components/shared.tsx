'use client'

import { ReactNode } from 'react'
import { LoadingBlock, EmptyState, Spinner, PageHeader } from '@/components/ui-bits'

export { LoadingBlock, EmptyState, Spinner, PageHeader }

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
