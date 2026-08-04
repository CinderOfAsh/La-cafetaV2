'use client'

import { useEffect, useRef, useState } from 'react'

const eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function eur(value: number): string {
  return eurFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export const DOW_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
export const DOW_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Reveal-on-mount hook: applies `.visible` class once on mount
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const raf = requestAnimationFrame(() => el.classList.add('visible'))
    return () => cancelAnimationFrame(raf)
  }, [])
  return ref
}

// Parse "1,2,3" CSV daysOfWeek → number[]
export function parseDays(csv?: string): number[] {
  if (!csv) return []
  return csv.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
}

// Today's date as YYYY-MM-DD
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}
