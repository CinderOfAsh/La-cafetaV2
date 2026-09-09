// La Cafeta V2 — Sincroniza menú V2 con la BD existente
//
// OBJETIVO: sin perder historial, sincronizar la BD con el menú V2 (Hoja 13).
//
// ACCIONES (idempotentes, se pueden ejecutar varias veces):
//   1. Marca isActive=false los packs viejos (los 5 que NO están en Hoja 13)
//   2. Crea/actualiza los 4 packs buenos (TLS, Leny, LEINN, Bakr) con isActive=true
//   3. Limpia tags obsoletos de productos existentes (los que no están en Hoja 13)
//   4. Crea/actualiza los 40 productos del menú V2 (precios, tags, isActive=true)
//      - Si el producto existe: actualiza precio, tags, isActive. Mantiene name.
//      - Si no existe: lo crea
//   5. Crea las recetas de los productos del menú V2
//      - Borra recetas del producto y las recrea (idempotente)
//
// NOTA: este script NO borra ventas, comandas, ni turnos. Solo toca:
//   - Product (isActive, price, tags)
//   - ProductRecipe (replace por producto)
//   - RawMaterial (crea las nuevas que falten, borra solo las que NO se usan)

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// ============================================================
// 1) MP nuevas (las que faltan en BD porque no existían en el menú viejo)
// ============================================================
const NEW_MATERIALS: { name: string; unit: string }[] = [
  // Bases panadería / bollería
  { name: 'Pan', unit: 'ud' },
  { name: 'Pan tostado', unit: 'ud' },
  { name: 'Pan de molde', unit: 'loncha' },
  { name: 'Pan para pinchos', unit: 'ud' },
  { name: 'Croissant', unit: 'ud' },
  { name: 'Gofre', unit: 'ud' },
  { name: 'Pizza', unit: 'ud' },
  // Proteínas
  { name: 'Tortilla', unit: 'ud' },
  { name: 'Pavo', unit: 'loncha' },
  { name: 'Queso', unit: 'loncha' },
  { name: 'Lomo', unit: 'loncha' },
  { name: 'Jamón', unit: 'loncha' },
  { name: 'Mantequilla', unit: 'gramo' },
  { name: 'Mantequilla de bote', unit: 'gramo' },
  { name: 'Mermelada de bote', unit: 'gramo' },
  { name: 'Nocilla', unit: 'gramo' },
  // Charcutería
  { name: 'Salchichón', unit: 'loncha' },
  // Salsas
  { name: 'Mayonesa', unit: 'gramo' },
  { name: 'Tomate de bote', unit: 'gramo' },
  { name: 'Aceite', unit: 'ml' },
  // Lácteos
  { name: 'Leche semi', unit: 'litro' },
  { name: 'Leche sin lactosa', unit: 'litro' },
  { name: 'Leche de avena', unit: 'litro' },
  { name: 'Mantequilla porción', unit: 'gramo' },
  // Bebidas
  { name: 'Cápsula de café', unit: 'ud' },
  { name: 'Café molido', unit: 'gramo' },
  { name: 'Sobre de Colacao', unit: 'ud' },
  { name: 'Manzanilla o te verde', unit: 'ud' },
  { name: 'Coca-Cola lata', unit: 'ud' },
  { name: 'Coca-Cola Zero lata', unit: 'ud' },
  { name: 'Fanta naranja lata', unit: 'ud' },
  { name: 'Aquarius lata', unit: 'ud' },
  { name: 'Nestea lata', unit: 'ud' },
  { name: 'Red Bull lata', unit: 'ud' },
  { name: 'Agua 33cl', unit: 'ud' },
  { name: 'Cerveza lata', unit: 'ud' },
  // Consumibles / servicio
  { name: 'Vaso pequeño', unit: 'ud' },
  { name: 'Vaso grande', unit: 'ud' },
  { name: 'Tapa de vaso pequeño', unit: 'ud' },
  { name: 'Cucharilla', unit: 'ud' },
  { name: 'Servilleta', unit: 'ud' },
  { name: 'Servilletas', unit: 'ud' },
  { name: 'Papel de horno', unit: 'ud' },
  { name: 'Plato', unit: 'ud' },
  { name: 'Pincho de madera', unit: 'ud' },
  { name: 'Bolsa', unit: 'ud' },
  { name: 'Tenedor', unit: 'ud' },
  { name: 'Palitos de queso', unit: 'ud' },
  { name: 'Nuggets', unit: 'ud' },
]

// ============================================================
// 2) PRODUCTOS del menú V2 (40 productos del Hoja 13)
// ============================================================
interface RecipeItem { material: string; quantity: number }
interface ProductDef {
  name: string
  price: number
  tags: string[]
  recipes: RecipeItem[]
}

const PRODUCTS: ProductDef[] = [
  // --- COMIDA (15) ---
  { name: 'Tostada mantequilla y mermelada', price: 2.00, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Pan tostado', quantity: 1 }, { material: 'Mantequilla de bote', quantity: 10 },
      { material: 'Mermelada de bote', quantity: 10 }, { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Tostada tomate y aceite', price: 2.00, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan tostado', quantity: 1 }, { material: 'Tomate de bote', quantity: 15 }, { material: 'Aceite', quantity: 5 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Tostada jamón', price: 2.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan tostado', quantity: 1 }, { material: 'Jamón', quantity: 2 }, { material: 'Aceite', quantity: 3 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Tostada Nocilla', price: 2.50, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Pan tostado', quantity: 1 }, { material: 'Nocilla', quantity: 15 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Pincho tortilla', price: 1.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pan para pinchos', quantity: 1 }, { material: 'Tortilla', quantity: 1 },
      { material: 'Mayonesa', quantity: 5 }, { material: 'Papel de horno', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
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
  { name: 'Croissant a la plancha', price: 1.50, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Croissant', quantity: 1 }, { material: 'Mantequilla', quantity: 5 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Croissant pavo y queso', price: 2.50, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Croissant', quantity: 1 }, { material: 'Pavo', quantity: 2 }, { material: 'Queso', quantity: 1 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Croissant de chocolate', price: 2.50, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Croissant', quantity: 1 }, { material: 'Nocilla', quantity: 15 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Gofre', price: 2.00, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Gofre', quantity: 1 }, { material: 'Mantequilla', quantity: 5 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Gofre de chocolate', price: 3.00, tags: ['Comida', 'Dulce', 'Pan'],
    recipes: [
      { material: 'Gofre', quantity: 1 }, { material: 'Nocilla', quantity: 20 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Pizza', price: 3.00, tags: ['Comida', 'Salado', 'Pan'],
    recipes: [
      { material: 'Pizza', quantity: 1 }, { material: 'Queso', quantity: 1 },
      { material: 'Plato', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Palitos de queso', price: 2.50, tags: ['Comida', 'Salado', 'Frito'],
    recipes: [
      { material: 'Palitos de queso', quantity: 4 }, { material: 'Aceite', quantity: 20 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},
  { name: 'Nuggets', price: 2.50, tags: ['Comida', 'Salado', 'Frito'],
    recipes: [
      { material: 'Nuggets', quantity: 5 }, { material: 'Aceite', quantity: 20 },
      { material: 'Papel de horno', quantity: 1 }, { material: 'Servilleta', quantity: 1 },
    ]},

  // --- BEBIDAS (23) ---
  { name: 'Café con leche pequeño', price: 1.20, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Leche semi', quantity: 0.15 }, { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café con leche grande', price: 1.50, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Leche semi', quantity: 0.20 }, { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café solo pequeño', price: 1.20, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café solo grande', price: 1.50, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café sin lactosa pequeño', price: 1.20, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Leche sin lactosa', quantity: 0.15 }, { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café sin lactosa grande', price: 1.50, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Leche sin lactosa', quantity: 0.20 }, { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café americano pequeño', price: 1.20, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Café molido', quantity: 7 }, { material: 'Vaso pequeño', quantity: 1 },
      { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café americano grande', price: 1.50, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Café molido', quantity: 10 }, { material: 'Vaso grande', quantity: 1 },
      { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café con leche de avena pequeño', price: 1.50, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Leche de avena', quantity: 0.15 }, { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Café con leche de avena grande', price: 1.80, tags: ['Bebida', 'Cafe', 'Caliente'],
    recipes: [
      { material: 'Leche de avena', quantity: 0.20 }, { material: 'Cápsula de café', quantity: 1 },
      { material: 'Vaso grande', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'ColaCao', price: 1.20, tags: ['Bebida', 'Caliente', 'Dulce'],
    recipes: [
      { material: 'Leche semi', quantity: 0.20 }, { material: 'Sobre de Colacao', quantity: 1 },
      { material: 'Cucharilla', quantity: 1 },
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'ColaCao sin lactosa', price: 1.20, tags: ['Bebida', 'Caliente', 'Dulce'],
    recipes: [
      { material: 'Leche sin lactosa', quantity: 0.20 }, { material: 'Sobre de Colacao', quantity: 1 },
      { material: 'Cucharilla', quantity: 1 },
      { material: 'Vaso pequeño', quantity: 1 }, { material: 'Tapa de vaso pequeño', quantity: 1 },
    ]},
  { name: 'Té', price: 1.00, tags: ['Bebida', 'Caliente'],
    recipes: [
      { material: 'Manzanilla o te verde', quantity: 1 }, { material: 'Vaso pequeño', quantity: 1 },
    ]},
  { name: 'Agua', price: 1.00, tags: ['Bebida', 'Frio'],
    recipes: [{ material: 'Agua 33cl', quantity: 1 }]},
  { name: 'Coca-Cola', price: 1.20, tags: ['Bebida', 'Refresco', 'Dulce', 'Frio'],
    recipes: [{ material: 'Coca-Cola lata', quantity: 1 }]},
  { name: 'Coca-Cola Zero', price: 1.20, tags: ['Bebida', 'Refresco', 'Dulce', 'Frio'],
    recipes: [{ material: 'Coca-Cola Zero lata', quantity: 1 }]},
  { name: 'Fanta de naranja', price: 1.20, tags: ['Bebida', 'Refresco', 'Dulce', 'Frio'],
    recipes: [{ material: 'Fanta naranja lata', quantity: 1 }]},
  { name: 'Aquarius de limón', price: 1.20, tags: ['Bebida', 'Refresco', 'Frio'],
    recipes: [{ material: 'Aquarius lata', quantity: 1 }]},
  { name: 'Nestea', price: 1.20, tags: ['Bebida', 'Refresco', 'Dulce', 'Frio'],
    recipes: [{ material: 'Nestea lata', quantity: 1 }]},
  { name: 'Red Bull sin azúcar', price: 1.70, tags: ['Bebida', 'Refresco', 'Frio'],
    recipes: [{ material: 'Red Bull lata', quantity: 1 }]},
  { name: 'Red Bull naranja', price: 1.70, tags: ['Bebida', 'Refresco', 'Frio'],
    recipes: [{ material: 'Red Bull lata', quantity: 1 }]},
  { name: 'Red Bull blanco', price: 1.70, tags: ['Bebida', 'Refresco', 'Frio'],
    recipes: [{ material: 'Red Bull lata', quantity: 1 }]},
  { name: 'Cerveza', price: 1.50, tags: ['Bebida', 'Refresco', 'Agua Bendita', 'Frio'],
    recipes: [{ material: 'Cerveza lata', quantity: 1 }]},

  // --- PACKS (4) — sin recipe, se piden al vender ---
  { name: 'Pack TLS', price: 2.25, tags: ['Comida', 'Pack', 'Cafe', 'Dulce'], recipes: [] },
  { name: 'Pack Leny', price: 3.00, tags: ['Comida', 'Pack', 'Cafe', 'Dulce'], recipes: [] },
  { name: 'Pack LEINN', price: 4.00, tags: ['Comida', 'Pack', 'Salado'], recipes: [] },
  { name: 'Pack Bakr', price: 3.00, tags: ['Comida', 'Pack', 'Cafe'], recipes: [] },
]

// Packs a descatalogar (los del Excel V1 que ya no se venden)
const DEPRECATED_PACKS = [
  'Pack desayuno sandwich',
  'Pack desayuno tostada',
  'Pack dulce',
  'Pack comida lomo',
  'Pack comida tortilla',
]

// Tags obsoletos (los que NO están en el Hoja 13)
const OBSOLETE_TAGS = [
  'bocadillo', 'Croissant', 'Sofía', 'sofía', 'Jose_Adri_Aitana',
  'comida de niños', 'cliente', 'frita', 'frito', 'postre',
]

async function main() {
  console.log('🌱 Sincronizando menú V2 con BD existente')
  console.log(`   Productos a sincronizar: ${PRODUCTS.length}`)
  console.log(`   Packs a descatalogar: ${DEPRECATED_PACKS.length}`)
  console.log(`   Tags obsoletos a limpiar: ${OBSOLETE_TAGS.length}`)
  console.log(`   MP a verificar/crear: ${NEW_MATERIALS.length}`)

  // ============================================================
  // 1) Descatalogar packs viejos (isActive=false)
  // ============================================================
  console.log('\n1. Descatalogando packs viejos...')
  let packsDeactivated = 0
  for (const name of DEPRECATED_PACKS) {
    const p = await db.product.findFirst({ where: { name } })
    if (p && p.isActive) {
      await db.product.update({ where: { id: p.id }, data: { isActive: false } })
      packsDeactivated++
      console.log(`   ✗ ${name} → isActive=false`)
    }
  }
  console.log(`   ✓ Packs descatalogados: ${packsDeactivated}`)

  // ============================================================
  // 2) Crear/actualizar MP nuevas (idempotente)
  // ============================================================
  console.log('\n2. Creando/verificando materias primas nuevas...')
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
  console.log(`   ✓ MP nuevas creadas: ${mpCreated}`)

  // ============================================================
  // 3) Limpiar tags obsoletos de productos existentes
  // ============================================================
  console.log('\n3. Limpiando tags obsoletos de productos existentes...')
  const allProducts = await db.product.findMany()
  let productsCleaned = 0
  for (const p of allProducts) {
    const tags = JSON.parse(p.tags || '[]') as string[]
    const cleaned = tags.filter(t => !OBSOLETE_TAGS.includes(t))
    if (cleaned.length !== tags.length) {
      await db.product.update({
        where: { id: p.id },
        data: { tags: JSON.stringify(cleaned) },
      })
      productsCleaned++
    }
  }
  console.log(`   ✓ Productos con tags limpiados: ${productsCleaned}`)

  // ============================================================
  // 4) Crear/actualizar productos del menú V2
  // ============================================================
  console.log('\n4. Sincronizando productos del menú V2...')
  let productsCreated = 0
  let productsUpdated = 0
  const productByName = new Map<string, string>()
  for (const p of PRODUCTS) {
    const existing = await db.product.findFirst({ where: { name: p.name } })
    if (existing) {
      // Actualiza precio, tags e isActive, mantiene todo lo demás
      await db.product.update({
        where: { id: existing.id },
        data: {
          price: p.price,
          tags: JSON.stringify(p.tags),
          isActive: true,
        },
      })
      productsUpdated++
      productByName.set(p.name, existing.id)
    } else {
      const created = await db.product.create({
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
      productsCreated++
      productByName.set(p.name, created.id)
    }
  }
  console.log(`   ✓ Productos creados: ${productsCreated}, actualizados: ${productsUpdated}`)

  // ============================================================
  // 5) Crear/actualizar recetas (idempotente: borra y recrea por producto)
  // ============================================================
  console.log('\n5. Sincronizando recetas...')
  const mpByName = new Map<string, string>()
  const allMp = await db.rawMaterial.findMany()
  for (const mp of allMp) mpByName.set(mp.name, mp.id)

  let recipesCreated = 0
  let warnings = 0
  for (const p of PRODUCTS) {
    const productId = productByName.get(p.name)
    if (!productId) continue
    // Borra recipes existentes de este producto
    await db.productRecipe.deleteMany({ where: { productId } })
    // Recrea
    for (const r of p.recipes) {
      const mpId = mpByName.get(r.material)
      if (!mpId) {
        console.log(`   ⚠ MP no encontrada: ${r.material} (en receta de ${p.name})`)
        warnings++
        continue
      }
      await db.productRecipe.create({
        data: { productId, rawMaterialId: mpId, quantity: r.quantity },
      })
      recipesCreated++
    }
  }
  console.log(`   ✓ Recetas creadas: ${recipesCreated} (warnings: ${warnings})`)

  console.log('\n✅ Sincronización menú V2 OK.')
  console.log(`   - Packs descatalogados: ${packsDeactivated}`)
  console.log(`   - MP nuevas: ${mpCreated}`)
  console.log(`   - Productos con tags limpiados: ${productsCleaned}`)
  console.log(`   - Productos del menú V2: ${productsCreated} nuevos, ${productsUpdated} actualizados`)
  console.log(`   - Recetas: ${recipesCreated}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
