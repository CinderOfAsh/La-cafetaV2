import { cookies } from 'next/headers'
import { db } from './db'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'la-cafeta-secret-key-dev-2026'

export interface TokenPayload {
  userId: string
  role: string
  name: string
  email: string
}

// JWT casero (base64 header.payload.signature con HMAC-SHA256)
function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(data: string): string {
  let str = data.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64').toString('utf8')
}

function sign(data: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function createToken(payload: TokenPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: Date.now() }))
  const signature = sign(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, signature] = parts
    const expected = sign(`${header}.${body}`)
    if (signature !== expected) return null
    const payload = JSON.parse(base64UrlDecode(body))
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireUser(): Promise<TokenPayload> {
  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')
  return user
}

export async function requireAdmin(): Promise<TokenPayload> {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new Error('Requiere rol ADMIN')
  return user
}

// Helper para verificar usuario existe en BD (opcional)
export async function getUserFromDb(userId: string) {
  return db.user.findUnique({ where: { id: userId } })
}
