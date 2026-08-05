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

// Inicializa esquema + seed si la BD está vacía. Solo en tiempo de EJECUCIÓN:
// durante `next build` (fase de recolección de página con 40 workers) no se toca
// la BD — eso lo hace el server al arrancar/primera petición.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
if (!isBuildPhase) {
  await ensureDb(client)
}

export const db = client
