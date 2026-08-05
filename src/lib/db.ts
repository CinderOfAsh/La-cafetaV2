import { PrismaClient } from '@prisma/client'
import { ensureDb } from './ensure-db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client

// Crea el esquema y siembra datos mínimos si la BD está vacía (primer arranque).
// Top-level await: ningún importador usa `db` hasta que esto termina.
await ensureDb(client)

export const db = client
