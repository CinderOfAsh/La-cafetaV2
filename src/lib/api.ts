'use client'

import { toast } from 'sonner'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Error ${res.status}`
    try {
      const body = await res.json()
      msg = body.error || body.message || msg
    } catch {
      // ignore
    }
    if (res.status !== 401) toast.error(msg)
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as unknown as T
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { method: 'GET', ...init })
  return handle<T>(res)
}

export async function apiPost<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  })
  return handle<T>(res)
}

export async function apiPut<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  })
  return handle<T>(res)
}

export async function apiDel<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { method: 'DELETE', ...init })
  return handle<T>(res)
}

// Upload file, returns { url }
export async function apiUpload(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    toast.error(body.error || 'Error al subir archivo')
    throw new Error(body.error || 'Upload failed')
  }
  const data = await res.json()
  return data.url as string
}

// Helpers that unwrap the { data: ... } envelope
export async function get<T>(url: string): Promise<T> {
  const r = await apiGet<{ data: T }>(url)
  return r.data
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const r = await apiPost<{ data: T } | { ok: true }>(url, body)
  if (r && typeof r === 'object' && 'data' in r) return (r as { data: T }).data
  return undefined as unknown as T
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const r = await apiPut<{ data: T } | { ok: true }>(url, body)
  if (r && typeof r === 'object' && 'data' in r) return (r as { data: T }).data
  return undefined as unknown as T
}

export async function del<T>(url: string): Promise<T> {
  const r = await apiDel<{ data: T } | { ok: true }>(url)
  if (r && typeof r === 'object' && 'data' in r) return (r as { data: T }).data
  return undefined as unknown as T
}

// CSV export fetcher — returns text
export async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    toast.error('Error al exportar CSV')
    throw new Error('CSV export failed')
  }
  return res.text()
}
