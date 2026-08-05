// Auto-inicialización de la BD en arranque (producción y demo).
// Crea el esquema si no existe y siembra datos mínimos si está vacía.
// Así no dependemos de comandos del panel de hosting (db push, seed manual).
import type { PrismaClient } from '@prisma/client'

const SCHEMA_SQL = `-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ud',
    "stock" REAL NOT NULL DEFAULT 0,
    "minStock" REAL NOT NULL DEFAULT 0,
    "lastPurchasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "ProductRecipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductRecipe_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplier" TEXT,
    "notes" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "invoiceUrl" TEXT,
    "conciliatedAt" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
    "openingProtocol" TEXT NOT NULL DEFAULT '[]',
    "closingProtocol" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CAMARERO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShiftSwap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalUserId" TEXT NOT NULL,
    "replacementUserId" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'swap',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "replacementShiftAssignmentId" TEXT,
    "seenByOriginal" BOOLEAN NOT NULL DEFAULT false,
    "seenByReplacement" BOOLEAN NOT NULL DEFAULT false,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShiftSwap_originalUserId_fkey" FOREIGN KEY ("originalUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftSwap_replacementUserId_fkey" FOREIGN KEY ("replacementUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftSwap_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "ShiftAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShiftSwap_replacementShiftAssignmentId_fkey" FOREIGN KEY ("replacementShiftAssignmentId") REFERENCES "ShiftAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnoId" INTEGER NOT NULL DEFAULT 1,
    "employeeId" TEXT,
    "total" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "SaleTransaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "productId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Protocol_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProtocolCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completedBy" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtocolCompletion_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRecipe_productId_rawMaterialId_key" ON "ProductRecipe"("productId", "rawMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_productId_key" ON "Protocol"("productId");

`

export async function ensureDb(db: PrismaClient) {
  // 1) Crear tablas si no existen (BD vacía)
  const tables = await db.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table'"
  )
  const hasUser = tables.some((t) => t.name === 'User')
  if (!hasUser) {
    const statements = SCHEMA_SQL.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)
    for (const stmt of statements) {
      await db.$executeRawUnsafe(stmt)
    }
  }

  // 2) Sembrar datos mínimos si no hay usuarios
  const userCount = await db.user.count()
  if (userCount > 0) return

  const admin = await db.user.create({
    data: { name: 'Bullerre', email: 'bullerre@lacafeta.com', role: 'ADMIN' },
  })
  const angel = await db.user.create({
    data: { name: 'Angel', email: 'angel@lacafeta.com', role: 'CAMARERO' },
  })
  const aitana = await db.user.create({
    data: { name: 'Aitana', email: 'aitana@lacafeta.com', role: 'COCINERO' },
  })

  const [bocadillo, kafe, agua] = await Promise.all([
    db.product.create({
      data: { name: 'Bocadillo de lomo y queso', price: 4, tags: JSON.stringify(['Bocadillos', 'Comida']) },
    }),
    db.product.create({
      data: { name: 'Kafe Kn Leche Grande', price: 1.5, tags: JSON.stringify(['Bebidas', 'Caliente', 'Cafe']) },
    }),
    db.product.create({
      data: { name: 'Agua', price: 1, tags: JSON.stringify(['Bebidas', 'Agua']) },
    }),
  ])

  await db.shift.createMany({
    data: [
      { name: 'Mañana', startTime: '08:45', endTime: '13:00', daysOfWeek: '1,2,3,4,5' },
      { name: 'Tarde', startTime: '13:00', endTime: '17:00', daysOfWeek: '1,2,3,4,5' },
    ],
  })

  await db.protocol.createMany({
    data: [
      { type: 'APERTURA', name: 'Apertura general cantina', steps: JSON.stringify(['Encender máquina', 'Montar caja', 'Revisar stock']) },
      { type: 'CIERRE', name: 'Cierre general cantina', steps: JSON.stringify(['Arqueo de caja', 'Limpiar zona', 'Apagar máquina']) },
    ],
  })

  await db.rawMaterial.createMany({
    data: [
      { name: 'Barra de pan', unit: 'ud', stock: 4, minStock: 5 },
      { name: 'Lomo', unit: 'loncha', stock: 40, minStock: 10 },
      { name: 'Queso', unit: 'loncha', stock: 25, minStock: 10 },
      { name: 'Leche semi', unit: 'L', stock: 11.5, minStock: 6 },
    ],
  })

  await db.productRecipe.createMany({
    data: [
      { productId: bocadillo.id, rawMaterialId: (await db.rawMaterial.findFirst({ where: { name: 'Barra de pan' } }))!.id, quantity: 1 },
      { productId: bocadillo.id, rawMaterialId: (await db.rawMaterial.findFirst({ where: { name: 'Lomo' } }))!.id, quantity: 2 },
      { productId: bocadillo.id, rawMaterialId: (await db.rawMaterial.findFirst({ where: { name: 'Queso' } }))!.id, quantity: 1 },
    ],
  })

  // Algunas ventas para que el dashboard no salga vacío
  const saleTime = new Date(Date.now() - 2 * 60 * 60 * 1000) // hace 2h
  await db.saleTransaction.create({
    data: {
      createdAt: saleTime,
      employeeId: angel.id,
      total: 9.5,
      paymentMethod: 'cash',
      items: {
        create: [
          { productId: bocadillo.id, productName: bocadillo.name, quantity: 2, price: 4, priority: 0, status: 'DELIVERED' },
          { productId: kafe.id, productName: kafe.name, quantity: 1, price: 1.5, priority: 1, status: 'DELIVERED' },
        ],
      },
    },
  })
  await db.saleTransaction.create({
    data: {
      createdAt: saleTime,
      employeeId: aitana.id,
      total: 4.5,
      paymentMethod: 'card',
      items: {
        create: [
          { productId: kafe.id, productName: kafe.name, quantity: 1, price: 1.5, priority: 0, status: 'DELIVERED' },
          { productId: agua.id, productName: agua.name, quantity: 3, price: 1, priority: 1, status: 'DELIVERED' },
        ],
      },
    },
  })

  console.log('[ensureDb] esquema creado y datos sembrados:', {
    admin: admin.email,
    empleados: [angel.email, aitana.email],
    productos: 3,
    turnos: 2,
    protocolos: 2,
    ventas: 2,
  })
}
