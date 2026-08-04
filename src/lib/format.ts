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
  return localDateStr(d)
}

// Format a Date as YYYY-MM-DD using LOCAL time components (not UTC).
// This avoids the timezone shift bug where toISOString() can move the date
// backwards by one day when the local timezone is ahead of UTC.
export function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// Week starts on Monday (es-ES convention). DOW_LABELS[0] = Lunes.
export const DOW_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
export const DOW_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

// Convert JS getDay() (0=Sun..6=Sat) to Monday-first index (0=Mon..6=Sun)
export function mondayFirstOffset(jsDay: number): number {
  return (jsDay + 6) % 7
}

// Spanish name for a JS day-of-week (0=Sun..6=Sat)
export function dowNameEs(jsDay: number): string {
  // DOW_FULL is Monday-first, so convert
  return DOW_FULL[(jsDay + 6) % 7]
}
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

// Today's date as YYYY-MM-DD (local time)
export function todayStr(): string {
  return localDateStr(new Date())
}

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}
