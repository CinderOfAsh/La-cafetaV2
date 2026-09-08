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

// Mutex simple: garantiza que la inicialización solo corre una vez por proceso,
// aunque varias rutas importen db.ts a la vez (workers de build, hot reload, etc.)
let initPromise: Promise<void> | null = null

export function ensureDb(db: PrismaClient): Promise<void> {
  if (!initPromise) {
    initPromise = doInit(db).catch((err) => {
      initPromise = null // si falla, permitir reintento
      throw err
    })
  }
  return initPromise
}

async function doInit(db: PrismaClient) {
  // 1) Esquema: CREATE ... IF NOT EXISTS → idempotente y seguro ante carreras
  const statements = SCHEMA_SQL.replace(/CREATE TABLE/g, 'CREATE TABLE IF NOT EXISTS')
    .replace(/CREATE UNIQUE INDEX/g, 'CREATE UNIQUE INDEX IF NOT EXISTS')
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  for (const stmt of statements) {
    await db.$executeRawUnsafe(stmt)
  }

  // 2) FORCE RESEED (opt-in): si FORCE_RESEED=true, BORRA todo el contenido de las
  // tablas "de seed" y deja que el bloque siguiente las vuelva a crear.
  // ⚠ DESTRUCTIVO. Solo usar cuando quieras resetear la BD a un estado conocido.
  // En Hostinger se mete como env var, redespliegas, y luego la quitas.
  if (process.env.FORCE_RESEED === 'true') {
    console.log('[ensureDb] FORCE_RESEED=true → borrando tablas de seed antes de re-sembrar')
    // Orden IMPORTANTE: borrar primero las hijas (que tienen FK a User/Product/etc),
    // luego las madres. Si no, Prisma lanza "Foreign key constraint violated".
    await db.protocolCompletion.deleteMany({})
    await db.shiftSwap.deleteMany({})
    await db.shiftAssignment.deleteMany({})
    await db.shift.deleteMany({})
    await db.protocol.deleteMany({})
    await db.purchaseItem.deleteMany({})
    await db.purchase.deleteMany({})
    await db.saleItem.deleteMany({})
    await db.saleTransaction.deleteMany({})
    await db.productRecipe.deleteMany({})
    await db.product.deleteMany({})
    await db.rawMaterial.deleteMany({})
    await db.user.deleteMany({})
  }

  // 3) Seed: usuarios legacy (Bullerre/Angel/Aitana) — solo si NO estamos en reseed
  // (en reseed, el bloque posterior los crea desde cero con los 16 del Excel).
  if (process.env.FORCE_RESEED !== 'true') {
    const admin = await db.user.upsert({
      where: { email: 'bullerre@lacafeta.com' },
      update: { role: 'ADMIN' },
      create: { name: 'Bullerre', email: 'bullerre@lacafeta.com', role: 'ADMIN' },
    })
    const angel = await db.user.upsert({
      where: { email: 'angel@lacafeta.com' },
      update: {},
      create: { name: 'Angel', email: 'angel@lacafeta.com', role: 'CAMARERO' },
    })
    const aitana = await db.user.upsert({
      where: { email: 'aitana@lacafeta.com' },
      update: {},
      create: { name: 'Aitana', email: 'aitana@lacafeta.com', role: 'COCINERO' },
    })
    void admin; void angel; void aitana
  }

  // 4) Si la BD está totalmente vacía (estado post-reseed o BD fresca), sembramos
  // el catálogo real de Bakr (16 users + 42 productos + 48 MP).
  // Si ya hay productos, no tocamos nada.
  const productCount = await db.product.count()
  if (productCount > 0) return

  // ===== Seed real (antes solo había 3 productos demo aquí) =====
  const IMG_PRODUCTO =
    'https://imgs.search.brave.com/1KFqvjAAgwOVTHmBvYMg-W705_4tusJKwBRTgf1LLsE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41NDE1/NTk4MzI3LjIzOTcv/cmFmLDM2MHgzNjAs/MDc1LHQsZmFmYWZh/OmNhNDQzZjQ3ODYu/dTUuanBn'

  const USERS = [
    { name: 'Bakr',    email: 'mohammadbakr.ouahid@alumni.mondragon.edu', role: 'ADMIN',    password: '0009' },
    { name: 'Aitana',  email: 'aitana.gonzalez@alumni.mondragon.edu',     role: 'EMPLOYEE', password: ''    },
    { name: 'Angel',   email: 'angel.rodriguez@alumni.mondragon.edu',     role: 'EMPLOYEE', password: ''    },
    { name: 'Adrian',  email: 'adrian.navarro@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
    { name: 'Claudia', email: 'claudia.gordo@alumni.mondragon.edu',       role: 'EMPLOYEE', password: ''    },
    { name: 'Elias',   email: 'eliasbenjamin.vicen@alumni.mondragon.edu', role: 'EMPLOYEE', password: ''    },
    { name: 'Diego S', email: 'diego.sanchezg@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
    { name: 'Diego V', email: 'diego.villasante@alumni.mondragon.edu',    role: 'EMPLOYEE', password: ''    },
    { name: 'Hugo',    email: 'hugonicholas.abrey@alumni.mondragon.edu',  role: 'EMPLOYEE', password: ''    },
    { name: 'Jose G',  email: 'josefrancisco.gomez@alumni.mondragon.edu',role: 'EMPLOYEE', password: ''    },
    { name: 'Javi C',  email: 'javier.diazn@alumni.mondragon.edu',        role: 'EMPLOYEE', password: ''    },
    { name: 'Javi M',  email: 'franciscojavier.garg@alumni.mondragon.edu',role: 'EMPLOYEE', password: ''    },
    { name: 'Kawtar',  email: 'kawtar.mellass@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
    { name: 'Luca',    email: 'luca.rodriguez@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
    { name: 'Sofía',   email: 'sofia.villabrille@alumni.mondragon.edu',   role: 'EMPLOYEE', password: ''    },
    { name: 'Vittorio',email: 'vittorioniccola.camp@alumni.mondragon.edu',role: 'EMPLOYEE', password: ''    },
  ]

  // Upsert para no duplicar si se reinicia la BD parcialmente
  for (const u of USERS) {
    await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: u.password, isActive: true },
      create: { name: u.name, email: u.email, role: u.role, password: u.password, isActive: true, customFields: '{}' },
    })
  }

  const PRODUCTS: { name: string; price: number; tags: string[]; imageUrl: string | null }[] = [
    { name: 'Sandwich pavo y queso',          price: 2.50, tags: ['bocadillo', 'caliente', 'salado'],       imageUrl: IMG_PRODUCTO },
    { name: 'Tostada mantequilla y mermelada',price: 2.00, tags: ['bocadillo', 'dulce'],                    imageUrl: IMG_PRODUCTO },
    { name: 'Tostada tomate y aceite',        price: 2.00, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
    { name: 'Tostada jamón',                  price: 2.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
    { name: 'Pincho tortilla',                price: 1.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
    { name: 'Croissant a la plancha',         price: 1.50, tags: ['Croissant', 'dulce', 'salado', 'caliente'], imageUrl: IMG_PRODUCTO },
    { name: 'Bocata lomo y queso',            price: 3.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
    { name: 'Bocata jamón',                   price: 3.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
    { name: 'Bocata tortilla',                price: 3.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
    { name: 'Gofre',                          price: 2.50, tags: ['postre', 'dulce'],                       imageUrl: IMG_PRODUCTO },
    { name: 'Croissant pavo y queso',         price: 2.50, tags: ['Croissant', 'dulce', 'salado'],         imageUrl: IMG_PRODUCTO },
    { name: 'Pizza',                          price: 3.00, tags: ['caliente', 'bocadillo'],                 imageUrl: IMG_PRODUCTO },
    { name: 'Palitos de queso',               price: 2.50, tags: ['frito', 'cliente', 'Jose_Adri_Aitana', 'comida de niños'], imageUrl: IMG_PRODUCTO },
    { name: 'Café con leche pequeño',         price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Café sin lactosa pequeño',       price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Café americano pequeño',         price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Café solo pequeño',              price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'ColaCao',                        price: 1.20, tags: ['bebida', 'caliente', 'frio', 'dulce'],   imageUrl: IMG_PRODUCTO },
    { name: 'ColaCao sin lactosa',            price: 1.20, tags: ['bebida', 'caliente', 'frio', 'dulce'],   imageUrl: IMG_PRODUCTO },
    { name: 'Café con leche grande',          price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Café sin lactosa grande',        price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Café americano grande',          price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Café solo grande',               price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
    { name: 'Té',                             price: 1.20, tags: ['bebida', 'caliente'],                    imageUrl: IMG_PRODUCTO },
    { name: 'Agua',                           price: 1.00, tags: ['bebida', 'frio'],                        imageUrl: IMG_PRODUCTO },
    { name: 'Coca-Cola',                      price: 1.20, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
    { name: 'Coca-Cola Zero',                 price: 1.20, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
    { name: 'Red Bull sin azúcar',            price: 1.70, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
    { name: 'Red Bull naranja',               price: 1.70, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
    { name: 'Red Bull blanco',                price: 1.70, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
    { name: 'Cerveza',                        price: 1.50, tags: ['bebida', 'refresco', 'agua bendita', 'frio'], imageUrl: IMG_PRODUCTO },
    { name: 'Fanta de naranja',               price: 1.20, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
    { name: 'Aquarius de limón',              price: 1.20, tags: ['sofía', 'bebida', 'fria', 'dulce'],      imageUrl: IMG_PRODUCTO },
    { name: 'Nestea',                         price: 1.20, tags: ['Sofía', 'bebida', 'fria', 'dulce'],      imageUrl: IMG_PRODUCTO },
    { name: 'Pack desayuno sandwich',         price: 3.00, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F7d30d51bf406648812f0c7ffaeb1ff42.1000x1000x1.png' },
    { name: 'Pack desayuno tostada',          price: 2.70, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fee777db36c1e6a87809f3280c190ab9c.1000x1000x1.png' },
    { name: 'Pack dulce',                     price: 3.25, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F1bb36868bb2b7bb0b8b3dbc9c92ac62c.1000x1000x1.png' },
    { name: 'Pack TLS',                       price: 2.25, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fa02e62a211860be7e9eeba1e4b05fb8b.1000x1000x1.jpg' },
    { name: 'Pack comida lomo',               price: 4.75, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F0f7f84ec4e47f6c89e9066225fbe16b0.1000x1000x1.png' },
    { name: 'Pack comida tortilla',           price: 4.75, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fb30a054c6bc082c407f04b227b1cda2b.1000x1000x1.png' },
    { name: 'Pack LEINN',                     price: 4.00, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fd5cfd7f6208861a053a51b3bbb62624c.1000x1000x1.png' },
    { name: 'Pack Bakr',                      price: 3.00, tags: ['pack'], imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F2037d9946a064f461b5c45eeb452fcac.1000x1000x1.png' },
  ]
  for (const p of PRODUCTS) {
    const exists = await db.product.findFirst({ where: { name: p.name } })
    if (!exists) {
      await db.product.create({
        data: {
          name: p.name,
          price: p.price,
          tags: JSON.stringify(p.tags),
          imageUrl: p.imageUrl,
          isActive: true,
          customFields: '{}',
        },
      })
    }
  }

  const RAW = [
    { name: 'pan de molde', unit: 'ud', minStock: 10 }, { name: 'pavo', unit: 'ud', minStock: 10 },
    { name: 'queso en lonchas', unit: 'ud', minStock: 10 }, { name: 'pan para tostadas', unit: 'ud', minStock: 10 },
    { name: 'mantequilla', unit: 'gramo', minStock: 10 }, { name: 'mermelada', unit: 'ud', minStock: 10 },
    { name: 'jamon', unit: 'ud', minStock: 10 }, { name: 'tortilla', unit: 'ud', minStock: 10 },
    { name: 'pan para pinchos', unit: 'ud', minStock: 10 }, { name: 'croissant', unit: 'ud', minStock: 10 },
    { name: 'lomo', unit: 'ud', minStock: 10 }, { name: 'gofre', unit: 'ud', minStock: 10 },
    { name: 'capsula de cafe doble', unit: 'ud', minStock: 10 }, { name: 'leche semi', unit: 'litro', minStock: 10 },
    { name: 'leche sin lactosa', unit: 'litro', minStock: 10 }, { name: 'leche de avena', unit: 'litro', minStock: 10 },
    { name: 'colacao', unit: 'ud', minStock: 10 }, { name: 'agua', unit: 'ud', minStock: 10 },
    { name: 'coca-cola', unit: 'ud', minStock: 10 }, { name: 'coca-cola Zero', unit: 'ud', minStock: 10 },
    { name: 'Red Bull sin azucar', unit: 'ud', minStock: 10 }, { name: 'Red Bull naranja', unit: 'ud', minStock: 10 },
    { name: 'Red Bull blanco', unit: 'ud', minStock: 10 }, { name: 'cerveza', unit: 'ud', minStock: 10 },
    { name: 'fanta naranja', unit: 'ud', minStock: 10 }, { name: 'te', unit: 'ud', minStock: 10 },
    { name: 'aquarius de limon', unit: 'ud', minStock: 10 }, { name: 'Nestea', unit: 'ud', minStock: 10 },
    { name: 'Pizza', unit: 'ud', minStock: 10 }, { name: 'palitos de queso', unit: 'ud', minStock: 10 },
    { name: 'patatas', unit: 'ud', minStock: 10 }, { name: 'capsulas de cafe descafeinado', unit: 'ud', minStock: 10 },
    { name: 'platos', unit: 'ud', minStock: 10 }, { name: 'vasos pequeños', unit: 'ud', minStock: 10 },
    { name: 'vasos medianos', unit: 'ud', minStock: 10 }, { name: 'vasos grandes', unit: 'ud', minStock: 10 },
    { name: 'tapas grandes', unit: 'ud', minStock: 10 }, { name: 'palillos', unit: 'ud', minStock: 10 },
    { name: 'tenedor de madera', unit: 'ud', minStock: 10 }, { name: 'cuchara de madera', unit: 'ud', minStock: 10 },
    { name: 'cuchillo de madera', unit: 'ud', minStock: 10 }, { name: 'papel de horno', unit: 'ud', minStock: 10 },
    { name: 'pegatinas', unit: 'ud', minStock: 10 }, { name: 'papel film', unit: 'ud', minStock: 10 },
    { name: 'servilletas', unit: 'ud', minStock: 10 },
    { name: 'quitagrasas', unit: 'litro', minStock: 10 }, { name: 'jabon', unit: 'litro', minStock: 10 }, { name: 'balletas', unit: 'litro', minStock: 10 },
  ]
  for (const r of RAW) {
    const exists = await db.rawMaterial.findFirst({ where: { name: r.name } })
    if (!exists) await db.rawMaterial.create({ data: { name: r.name, unit: r.unit, stock: 0, minStock: r.minStock } })
  }

  // ===== 5) Renombrar usuarios para que coincidan con el Excel de turnos =====
  // Javi C → Javi D (es "Javier Díaz" en el Excel de turnos)
  // Javi M → Javi G (es "Javier García" en el Excel de turnos)
  await db.user.updateMany({ where: { name: 'Javi C' }, data: { name: 'Javi D' } })
  await db.user.updateMany({ where: { name: 'Javi M' }, data: { name: 'Javi G' } })

  // ===== 6) Limpiar duplicado "Bakerre" (typo de Bullerre/admin legacy) =====
  // El admin real va a ser "BakerreGod"; "Bakerre" era ruido.
  const oldAdmin = await db.user.findFirst({ where: { name: 'Bakerre' } })
  if (oldAdmin) {
    // Solo borrar si NO tiene ventas/shifts asociados (seguridad)
    const salesCount = await db.saleTransaction.count({ where: { employeeId: oldAdmin.id } })
    if (salesCount === 0) {
      await db.user.delete({ where: { id: oldAdmin.id } })
      console.log('[ensureDb] usuario duplicado "Bakerre" eliminado')
    } else {
      // Si tiene ventas, solo lo renombramos para que no choque
      await db.user.update({ where: { id: oldAdmin.id }, data: { name: 'Bakerre-old' } })
    }
  }

  // ===== 7) Crear BakerreGod (ADMIN) y Bakr (empleado) =====
  const ADMIN_EMAIL = 'bakr.ouahid@gmail.com'
  const EMPLOYEE_EMAIL = 'mohammadbakr.ouahid@alumni.mondragon.edu'

  // Admin: BakerreGod
  await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: 'BakerreGod', role: 'ADMIN', isActive: true },
    create: {
      name: 'BakerreGod',
      email: ADMIN_EMAIL,
      password: '',
      role: 'ADMIN',
      isActive: true,
      customFields: '{}',
    },
  })

  // Empleado: Bakr (con el email antiguo de Bakr)
  await db.user.upsert({
    where: { email: EMPLOYEE_EMAIL },
    update: { name: 'Bakr', role: 'EMPLOYEE', isActive: true },
    create: {
      name: 'Bakr',
      email: EMPLOYEE_EMAIL,
      password: '',
      role: 'EMPLOYEE',
      isActive: true,
      customFields: '{}',
    },
  })

  // ===== 8) Crear los turnos de la Cafeta =====
  // Turnos LMX-J (8:45-13 / 13-17) + X cortos (12-14 / 14-17) + V corto (12-14)
  const SHIFTS = [
    { name: 'Mañana LMX',  startTime: '08:45', endTime: '13:00', daysOfWeek: '1,2,4' },     // L, M, J
    { name: 'Tarde LMX',   startTime: '13:00', endTime: '17:00', daysOfWeek: '1,2,4' },     // L, M, J
    { name: 'Mediodía X',  startTime: '12:00', endTime: '14:00', daysOfWeek: '3' },         // X
    { name: 'Tarde X',     startTime: '14:00', endTime: '17:00', daysOfWeek: '3' },         // X
    { name: 'Mediodía V',  startTime: '12:00', endTime: '14:00', daysOfWeek: '5' },         // V
  ]
  const shiftByName: Record<string, string> = {}
  for (const s of SHIFTS) {
    const exists = await db.shift.findFirst({ where: { name: s.name } })
    if (exists) {
      shiftByName[s.name] = exists.id
      // Actualizar horarios por si cambiaron
      await db.shift.update({ where: { id: exists.id }, data: s })
    } else {
      const created = await db.shift.create({ data: s })
      shiftByName[s.name] = created.id
    }
  }

  // ===== 9) Asignaciones por ciclo rotativo =====
  // 9 turnos por semana, 8 parejas. La pareja que abre la semana (lunes mañana)
  // tiene DOBLE turno (también hace el viernes). Las demás tienen 1 turno.
  // Cada semana todas las parejas rotan un puesto.
  //
  // Rotación de roles: la primera vez que una pareja tiene un turno, el primero
  // es cocinero y el segundo camarero. La siguiente vez que la misma pareja
  // tenga turno (sea otro día u otra semana), se invierten los roles. Así,
  // cada par de apariciones de la pareja los roles cambian.
  //
  // Orden del ciclo (1 → 8):
  //   1. BAKR & HUGO A.      → L mañana + V (doble)
  //   2. CLAUDIA & DIEGO V    → L tarde
  //   3. JAVIER G. & ÁNGEL    → Mañana del día siguiente
  //   4. ADRIÁN & JAVIER D.   → Tarde
  //   5. AITANA & VITTORIO    → X mañana
  //   6. JOSÉ G. & DIEGO S.   → X tarde
  //   7. LUCA & KAWTAR        → J mañana
  //   8. SOFÍA & ELÍAS        → J tarde
  type Pair = [string, string] // [cocinero, camarero] (en su primera aparición)
  const PAIR_ORDER: Pair[] = [
    ['Bakr', 'Hugo'],
    ['Claudia', 'Diego V'],
    ['Javi G', 'Angel'],
    ['Adrian', 'Javi D'],
    ['Aitana', 'Vittorio'],
    ['Jose G', 'Diego S'],
    ['Luca', 'Kawtar'],
    ['Sofía', 'Elias'],
  ]

  // Mapeo de cómo se distribuyen los 8 puestos a los 9 turnos
  // (la posición 1 cubre 2 turnos: el primero y el del viernes)
  const POSITION_TO_SHIFT_INDEX: Record<number, number[]> = {
    1: [0, 8],   // L mañana (turno 0) + V (turno 8)
    2: [1],      // L tarde (turno 1)
    3: [2],      // Mañana (turno 2)
    4: [3],      // Tarde (turno 3)
    5: [4],      // X mañana (turno 4)
    6: [5],      // X tarde (turno 5)
    7: [6],      // J mañana (turno 6)
    8: [7],      // J tarde (turno 7)
  }

  // Los 9 turnos en orden cronológico dentro de la semana
  // Cada entrada: { day: 0..6, shiftName }
  const WEEKLY_TURNS: { day: number; shiftName: string }[] = [
    { day: 1, shiftName: 'Mañana LMX' },  // 0: L mañana
    { day: 1, shiftName: 'Tarde LMX' },   // 1: L tarde
    { day: 2, shiftName: 'Mañana LMX' },  // 2: Mañana
    { day: 2, shiftName: 'Tarde LMX' },   // 3: Tarde
    { day: 3, shiftName: 'Mediodía X' },  // 4: X mañana
    { day: 3, shiftName: 'Tarde X' },    // 5: X tarde
    { day: 4, shiftName: 'Mañana LMX' },  // 6: J mañana
    { day: 4, shiftName: 'Tarde LMX' },   // 7: J tarde
    { day: 5, shiftName: 'Mediodía V' },  // 8: V
  ]

  // Para cada semana, devuelve las parejas rotadas.
  // semana 0: BAKR & HUGO abren; semana 1: CLAUDIA & DIEGO abren; etc.
  function getPairsForWeek(weekIndex: number): Pair[] {
    const rotated: Pair[] = []
    for (let i = 0; i < PAIR_ORDER.length; i++) {
      rotated.push(PAIR_ORDER[(i + weekIndex) % PAIR_ORDER.length])
    }
    return rotated
  }

  // Construir la lista completa de (semana, día, pareja, shiftName) en orden
  // cronológico global. Necesitamos este orden para asignar roles alternados.
  const startMonday = new Date('2026-09-07T00:00:00')
  const NUM_WEEKS = 5
  const FULL_PLAN: { date: string; shiftName: string; pair: Pair }[] = []
  for (let w = 0; w < NUM_WEEKS; w++) {
    const monday = new Date(startMonday)
    monday.setDate(monday.getDate() + w * 7)
    const pairsThisWeek = getPairsForWeek(w)
    for (const [position, turnIndices] of Object.entries(POSITION_TO_SHIFT_INDEX)) {
      const posNum = parseInt(position, 10)
      const pair = pairsThisWeek[posNum - 1]
      for (const turnIdx of turnIndices) {
        const turn = WEEKLY_TURNS[turnIdx]
        const date = new Date(monday)
        date.setDate(date.getDate() + (turn.day - 1))
        // Usar sv-SE (formato ISO local) para evitar el off-by-one de UTC
        const dateStr = date.toLocaleDateString('sv-SE')
        FULL_PLAN.push({ date: dateStr, shiftName: turn.shiftName, pair })
      }
    }
  }

  // Borrar todas las asignaciones desde el lunes 7-sep para empezar limpio
  const startStr = startMonday.toLocaleDateString('sv-SE')
  await db.shiftAssignment.deleteMany({
    where: { date: { gte: startStr } },
  })

  // Asignar roles alternando por aparición de la pareja
  // Para cada aparición N de una pareja (empezando en 0):
  //   - Si N es par → [cocinero, camarero] (orden original de la pareja)
  //   - Si N es impar → [camarero, cocinero] (roles invertidos)
  let created = 0
  const pairAppearances = new Map<string, number>()
  for (const plan of FULL_PLAN) {
    const pairKey = plan.pair.join('|')
    const appearanceIdx = pairAppearances.get(pairKey) ?? 0
    pairAppearances.set(pairKey, appearanceIdx + 1)

    const inverted = appearanceIdx % 2 === 1
    const [first, second] = inverted ? [plan.pair[1], plan.pair[0]] : plan.pair
    const roles = inverted ? ['CAMARERO', 'COCINERO'] : ['COCINERO', 'CAMARERO']

    const [u1, u2] = await Promise.all([
      db.user.findFirst({ where: { name: first } }),
      db.user.findFirst({ where: { name: second } }),
    ])
    const shift = await db.shift.findFirst({ where: { name: plan.shiftName } })
    if (!u1 || !u2 || !shift) {
      console.log(`[ensureDb] SKIP ${plan.date} ${plan.shiftName}: usuario o shift no encontrado (${first}, ${second})`)
      continue
    }
    await db.shiftAssignment.create({
      data: { date: plan.date, shiftId: shift.id, userId: u1.id, role: roles[0] },
    })
    await db.shiftAssignment.create({
      data: { date: plan.date, shiftId: shift.id, userId: u2.id, role: roles[1] },
    })
    created += 2
  }

  console.log(`[ensureDb] seed V1 aplicado (16 users + 42 productos + 48 MP + ${created} asignaciones de turno)`)
  return
}
