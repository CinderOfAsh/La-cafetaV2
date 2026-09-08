// La Cafeta V2 — Seed del menú V2 (40 productos con recetas)
//
// Borra productos y ProductRecipe existentes (sin tocar Users, Shifts, etc).
// Crea las nuevas MP que faltan.
// Crea los 40 productos con precios y tags del Excel "Hoja 13".
// Crea las recetas (ProductRecipe) que descuentan stock al vender.
//
// Idempotente: si lo corres 2 veces, queda igual.
//
// Uso:    npx tsx scripts/seed-menu-v2.ts

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ============================================================
// 1) MATERIALES — unidades lógicas
// ============================================================
// name, unit. Stock inicial 0 (lo mete el admin desde la web al recibir la compra).
const NEW_MATERIALS: { name: string; unit: string }[] = [
  // Bases panadería / bollería
  { name: 'Pan', unit: 'ud' },
  { name: 'Pan tostado', unit: 'ud' },
  { name: 'Pan de molde', unit: 'loncha' },
  { name: 'Pan para pinchos', unit: 'ud' },
  { name: 'Pan para tostadas', unit: 'ud' },
  { name: 'Croissant', unit: 'ud' },
  { name: 'Gofre', unit: 'ud' },
  // Rellenos
  { name: 'Tortilla', unit: 'ud' },
  { name: 'Pavo', unit: 'loncha' },
  { name: 'Queso', unit: 'loncha' },
  { name: 'Lomo', unit: 'loncha' },
  { name: 'Jamón', unit: 'loncha' },
  { name: 'Mantequilla', unit: 'gramo' },
  { name: 'Mantequilla de bote', unit: 'gramo' },
  { name: 'Mermelada de bote', unit: 'gramo' },
  { name: 'Tomate de bote', unit: 'gramo' },
  { name: 'Aceite', unit: 'litro' },
  { name: 'Mayonesa', unit: 'gramo' },
  { name: 'Ketchup', unit: 'gramo' },
  { name: 'Nocilla', unit: 'gramo' },
  { name: 'Palitos de queso', unit: 'ud' },
  { name: 'Pizza', unit: 'ud' },
  // Bebidas base
  { name: 'Leche semi', unit: 'litro' },
  { name: 'Leche semi sin lactosa', unit: 'litro' },
  { name: 'Leche sin lactosa', unit: 'litro' },
  { name: 'Leche', unit: 'litro' },
  { name: 'Cápsula de café', unit: 'ud' },
  { name: 'Sobre de ColaCao', unit: 'ud' },
  { name: 'Manzanilla o té verde', unit: 'ud' },
  { name: 'Agua caliente', unit: 'litro' },
  { name: 'Agua', unit: 'litro' },
  // Envases
  { name: 'Vaso', unit: 'ud' },
  { name: 'Vaso pequeño', unit: 'ud' },
  { name: 'Vaso Grande', unit: 'ud' },
  { name: 'Tapa de vaso pequeño', unit: 'ud' },
  { name: 'Cucharilla', unit: 'ud' },
  // Consumibles
  { name: 'Plato', unit: 'ud' },
  { name: 'Servilleta', unit: 'ud' },
  { name: 'Papel de horno', unit: 'ud' },
  { name: 'Tenedor', unit: 'ud' },
  { name: 'Cuchillo', unit: 'ud' },
]

// ============================================================
// 2) PRODUCTOS — 40 productos del menú nuevo (Hoja 13)
//
// tags: SIEMPRE incluye 'Comida' o 'Bebida' como primer tag.
// Para packs (Pack TLS/Leny/LEINN/Bakr) NO se mete recipe aquí,
// porque el pack elige productos hijos en tiempo de venta.
// Para esos productos el POS preguntará "¿qué productos incluye?".
// ============================================================
interface ProductInput {
  name: string
  price: number
  tags: string[]
  recipes: { material: string; quantity: number }[]   // materiales con su cantidad por unidad
}

const PRODUCTS: ProductInput[] = [
  // --- COMIDA (15) ---
  { name: 'Tostada mantequilla y mermelada', price: 2.00, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Pan tostado', quantity: 1 }, { material: 'Mantequilla de bote', quantity: 10 },
      { material: 'Mermelada de bote', quantity: 10 }, { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Tostada tomate y aceite', price: 2.00, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan tostado', quantity: 1 }, { material: 'Tomate de bote', quantity: 10 },
      { material: 'Aceite', quantity: 1 }, { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Pincho tortilla', price: 1.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Tortilla', quantity: 1 }, { material: 'Pan para pinchos', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Cuchillo', quantity: 1 },
      { material: 'Tenedor', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Sandwich pavo y queso', price: 2.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan de molde', quantity: 2 }, { material: 'Queso', quantity: 1 },
      { material: 'Pavo', quantity: 2 }, { material: 'Mantequilla', quantity: 5 },
      { material: 'Servilleta', quantity: 1 }, { material: 'Papel de horno', quantity: 1 },
    ]},
  { name: 'Bocata lomo y queso', price: 3.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan', quantity: 1 }, { material: 'Lomo', quantity: 2 },
      { material: 'Queso', quantity: 2 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Bocata jamón', price: 3.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan', quantity: 1 }, { material: 'Jamón', quantity: 2 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Bocata tortilla', price: 3.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan', quantity: 1 }, { material: 'Tortilla', quantity: 1 },
      { material: 'Mayonesa', quantity: 5 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Croissant a la plancha', price: 1.50, tags: ['Comida', 'Dulce', 'Postre'],
    recipes: [
      { material: 'Croissant', quantity: 1 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Croissant pavo y queso', price: 2.50, tags: ['Comida', 'Salado', 'Pan', 'Postre'],
    recipes: [
      { material: 'Croissant', quantity: 1 }, { material: 'Pavo', quantity: 1 },
      { material: 'Queso', quantity: 1 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Croissant de chocolate', price: 2.50, tags: ['Comida', 'Dulce', 'Postre'],
    recipes: [
      { material: 'Croissant', quantity: 1 }, { material: 'Nocilla', quantity: 10 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Gofre', price: 2.00, tags: ['Comida', 'Dulce', 'Postre'],
    recipes: [
      { material: 'Gofre', quantity: 1 }, { material: 'Plato', quantity: 1 },
      { material: 'Servilleta', quantity: 1 }, { material: 'Tenedor', quantity: 1 }, { material: 'Cuchillo', quantity: 1 },
    ]},
  { name: 'Gofre de chocolate', price: 3.00, tags: ['Comida', 'Dulce', 'Postre'],
    recipes: [
      { material: 'Gofre', quantity: 1 }, { material: 'Nocilla', quantity: 15 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
      { material: 'Tenedor', quantity: 1 }, { material: 'Cuchillo', quantity: 1 },
    ]},
  { name: 'Pizza', price: 3.00, tags: ['Comida', 'Salado', 'HUGO'],
    recipes: [
      { material: 'Pizza', quantity: 1 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Palitos de queso', price: 2.50, tags: ['Comida', 'Salado', 'ADRI'],
    recipes: [
      { material: 'Palitos de queso', quantity: 1 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Ketchup', quantity: 2 }, { material: 'Mayonesa', quantity: 2 },
    ]},
  { name: 'Nuggets', price: 2.50, tags: ['Comida', 'Salado', 'NIÑOS'],
    recipes: [
      { material: 'Palitos de queso', quantity: 2 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Ketchup', quantity: 2 }, { material: 'Mayonesa', quantity: 2 },
    ]},

  // --- BEBIDAS (20) ---
  { name: 'Café con leche pequeño', price: 1.20, tags: ['Bebida', 'Caliente', 'Cafe', 'Pequeño'],
    recipes: [
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Leche semi', quantity: 0.15 }, { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café sin lactosa pequeño', price: 1.20, tags: ['Bebida', 'Caliente', 'Cafe', 'Pequeño'],
    recipes: [
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Leche semi sin lactosa', quantity: 0.15 }, { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café americano pequeño', price: 1.20, tags: ['Bebida', 'Caliente', 'Cafe', 'Pequeño'],
    recipes: [
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Agua', quantity: 0.15 }, { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café solo pequeño', price: 1.00, tags: ['Bebida', 'Caliente', 'Cafe', 'Pequeño'],
    recipes: [
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café con leche grande', price: 1.50, tags: ['Bebida', 'Caliente', 'Cafe', 'Grande'],
    recipes: [
      { material: 'Vaso Grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Leche semi', quantity: 0.2 }, { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café sin lactosa grande', price: 1.50, tags: ['Bebida', 'Caliente', 'Cafe', 'Grande'],
    recipes: [
      { material: 'Vaso Grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Leche semi sin lactosa', quantity: 0.2 }, { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café americano grande', price: 1.50, tags: ['Bebida', 'Caliente', 'Cafe', 'Grande'],
    recipes: [
      { material: 'Vaso Grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Agua', quantity: 0.2 }, { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'Café solo grande', price: 1.20, tags: ['Bebida', 'Caliente', 'Cafe', 'Grande'],
    recipes: [
      { material: 'Vaso Grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
      { material: 'Cápsula de café', quantity: 1 },
    ]},
  { name: 'ColaCao', price: 1.20, tags: ['Bebida', 'Caliente', 'Grande', 'Postre'],
    recipes: [
      { material: 'Leche semi', quantity: 0.25 }, { material: 'Vaso Grande', quantity: 1 },
      { material: 'Sobre de ColaCao', quantity: 1 }, { material: 'Cucharilla', quantity: 1 },
    ]},
  { name: 'ColaCao sin lactosa', price: 1.20, tags: ['Bebida', 'Caliente', 'Grande', 'Postre'],
    recipes: [
      { material: 'Leche semi sin lactosa', quantity: 0.25 }, { material: 'Vaso Grande', quantity: 1 },
      { material: 'Sobre de ColaCao', quantity: 1 }, { material: 'Cucharilla', quantity: 1 },
    ]},
  { name: 'Té', price: 1.00, tags: ['Bebida', 'Caliente'],
    recipes: [
      { material: 'Vaso', quantity: 1 }, { material: 'Agua caliente', quantity: 0.2 },
      { material: 'Manzanilla o té verde', quantity: 1 },
    ]},

  // --- REFRESCOS (sin recipe — son productos finales ya en stock) ---
  { name: 'Coca-Cola', price: 1.20, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Coca-Cola Zero', price: 1.20, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Red Bull sin azúcar', price: 1.70, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Red Bull naranja', price: 1.70, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Red Bull blanco', price: 1.70, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Fanta de naranja', price: 1.70, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Aquarius de limón', price: 1.20, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Nestea', price: 1.20, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Agua', price: 1.00, tags: ['Bebida', 'Refresco'], recipes: [] },
  { name: 'Cerveza', price: 1.50, tags: ['Bebida', 'Agua Bendita'], recipes: [] },

  // --- PACKS (4) — sin recipes, el POS preguntará qué productos hijos incluye al vender ---
  { name: 'Pack TLS', price: 2.25, tags: ['Comida', 'Pack', 'Cafe', 'Dulce'], recipes: [] },
  { name: 'Pack Leny', price: 3.00, tags: ['Comida', 'Pack', 'Cafe', 'Dulce'], recipes: [] },
  { name: 'Pack LEINN', price: 4.00, tags: ['Comida', 'Pack', 'Salado'], recipes: [] },
  { name: 'Pack Bakr', price: 3.00, tags: ['Comida', 'Pack', 'Cafe'], recipes: [] },
]

// =====================================================================
// NOTA: PACK_DEFINITIONS ahora vive en src/components/shared.tsx para que
// tanto el seed (este script) como el POS (pos.tsx) puedan importarlo.
// =====================================================================

// ============================================================
// 4) MAIN
// ============================================================
async function main() {
  console.log('🌱 Seed menú V2 (40 productos con recetas)')
  console.log(`   Materiales a crear: ${NEW_MATERIALS.length}`)
  console.log(`   Productos a crear: ${PRODUCTS.length}`)

  // a) Borra todos los ProductRecipe y Product existentes (orden importante)
  console.log('\n1. Borrando productos y recetas existentes...')
  await db.productRecipe.deleteMany({})
  const deletedProducts = await db.product.deleteMany({})
  console.log(`   ✓ Productos borrados: ${deletedProducts.count}`)

  // b) Crea nuevas MP si no existen
  console.log('\n2. Creando materias primas nuevas...')
  let mpCreated = 0
  for (const m of NEW_MATERIALS) {
    const existing = await db.rawMaterial.findFirst({ where: { name: m.name } })
    if (!existing) {
      await db.rawMaterial.create({
        data: { name: m.name, unit: m.unit, stock: 0, minStock: 10 },
      })
      mpCreated++
    }
  }
  console.log(`   ✓ Materias primas creadas: ${mpCreated}`)

  // c) Borra MP obsoletas (las que NO se usan en el menú nuevo ni se llaman como las nuevas)
  const allMp = await db.rawMaterial.findMany()
  const newNames = new Set(NEW_MATERIALS.map(m => m.name))
  let mpDeleted = 0
  for (const mp of allMp) {
    if (!newNames.has(mp.name)) {
      // Solo borro si NO está siendo usada por ningún productRecipe
      // (los recipes ya se borraron arriba)
      await db.rawMaterial.delete({ where: { id: mp.id } }).catch(() => {})
      mpDeleted++
    }
  }
  console.log(`   ✓ Materias primas obsoletas borradas: ${mpDeleted}`)

  // d) Crea productos
  console.log('\n3. Creando productos...')
  let created = 0
  for (const p of PRODUCTS) {
    const product = await db.product.create({
      data: {
        name: p.name,
        price: p.price,
        tags: JSON.stringify(p.tags),
        imageUrl: null,
        description: null,
        isActive: true,
        customFields: '{}',
      },
    })
    created++

    // e) Crea recetas
    const mpByName = new Map<string, string>()
    const mps = await db.rawMaterial.findMany()
    for (const mp of mps) mpByName.set(mp.name, mp.id)

    for (const r of p.recipes) {
      const mpId = mpByName.get(r.material)
      if (!mpId) {
        console.log(`   ⚠ MP no encontrada: ${r.material} (en receta de ${p.name})`)
        continue
      }
      await db.productRecipe.create({
        data: { productId: product.id, rawMaterialId: mpId, quantity: r.quantity },
      })
    }
  }
  console.log(`   ✓ Productos creados: ${created}`)

  console.log('\n✅ Seed menú V2 OK.')
  console.log(`   - ${mpCreated} MP nuevas creadas`)
  console.log(`   - ${mpDeleted} MP obsoletas borradas`)
  console.log(`   - ${created} productos creados con recetas`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
