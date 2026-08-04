// Seed La Cafeta con datos REALES del CSV financiero
// Path del CSV: /home/z/my-project/upload/FINANZAS CAFETERÍA LEINN - VENTAS.csv
import { db } from '../src/lib/db'
import { readFileSync } from 'fs'

const CSV_PATH = '/home/z/my-project/upload/FINANZAS CAFETERÍA LEINN - VENTAS.csv'

// ---------- CSV parser robusto (maneja comillas y comas dentro de campos) ----------
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  let current = ''
  let inQuotes = false
  while (i < line.length) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      current += ch
      i++
      continue
    }
    // not in quotes
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ',') {
      fields.push(current)
      current = ''
      i++
      continue
    }
    current += ch
    i++
  }
  fields.push(current)
  return fields
}

// ---------- Parse precio español: "1,20 €" → 1.20 ----------
function parsePrice(s: string): number | null {
  if (!s) return null
  const cleaned = s
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')   // remove thousands separator (.)
    .replace(',', '.')    // decimal comma → dot
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

// ---------- Parse fecha DD/MM/YYYY → Date ----------
function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const day = parseInt(m[1], 10)
  const month = parseInt(m[2], 10) - 1
  const year = parseInt(m[3], 10)
  const d = new Date(year, month, day, 12, 0, 0)
  if (isNaN(d.getTime())) return null
  return d
}

// ---------- Parse hora "9:23:59" → { h, m } ----------
function parseTime(s: string): { h: number; m: number } | null {
  const parts = s.trim().split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  return { h, m }
}

// ---------- Normalizar nombre de producto para matching ----------
function normalizeProductName(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
    .replace(/ñ/g, 'n')
}

// ---------- Tags automáticos según nombre de producto ----------
function inferTags(name: string): string[] {
  const n = normalizeProductName(name)
  const tags: string[] = []
  if (n.includes('cafe') || n.includes('colacao') || n.includes('te')) tags.push('Bebidas')
  if (n.includes('cafe')) tags.push('Café')
  if (n.includes('bocata') || n.includes('sandwich') || n.includes('pack comida') || n.includes('pack desayuno')) tags.push('Bocadillos')
  if (n.includes('tostada')) tags.push('Tostadas')
  if (n.includes('croissant') || n.includes('gofre') || n.includes('galleta') || n.includes('pack dulce')) tags.push('Bollería')
  if (n.includes('agua') || n.includes('coca') || n.includes('cerveza') || n.includes('redbull') || n.includes('nestea') || n.includes('aquarius')) tags.push('Bebidas')
  if (n.includes('agua') || n.includes('coca') || n.includes('cerveza') || n.includes('redbull') || n.includes('nestea') || n.includes('aquarius')) tags.push('Sin alcohol')
  if (n.includes('cerveza') || n.includes('redbull')) tags.push('Alcohol')
  if (n.includes('pincho') || n.includes('tortilla')) tags.push('Pinchos')
  if (n.includes('pack')) tags.push('Packs')
  if (n.includes('tenedor') || n.includes('cuchillo')) tags.push('Cubiertos')
  return Array.from(new Set(tags))
}

// ---------- Infer role por nombre ----------
function inferRole(name: string): string {
  // Por defecto todos son EMPLOYEE
  return 'EMPLOYEE'
}

async function main() {
  console.log('🌱 Poblando La Cafeta con datos REALES del CSV...')

  // Limpiar BD
  await db.protocolCompletion.deleteMany()
  await db.protocol.deleteMany()
  await db.productRecipe.deleteMany()
  await db.rawMaterial.deleteMany()
  await db.saleItem.deleteMany()
  await db.saleTransaction.deleteMany()
  await db.shiftSwap.deleteMany()
  await db.shiftAssignment.deleteMany()
  await db.shiftDebt.deleteMany()
  await db.shift.deleteMany()
  await db.inventory.deleteMany()
  await db.product.deleteMany()
  await db.user.deleteMany()

  // Leer CSV
  const raw = readFileSync(CSV_PATH, 'utf-8')
  const lines = raw.split(/\r?\n/)

  // Skip header
  const dataLines = lines.slice(1)

  interface SaleRow {
    date: Date
    time: { h: number; m: number }
    productName: string
    payment: 'cash' | 'card'
    people: string[]
    price: number
    comment?: string
  }

  const sales: SaleRow[] = []
  const productPrices = new Map<string, number>()
  const productNameVariants = new Map<string, string>() // normalized → display name
  const peopleSet = new Set<string>()
  const productCatalogQuantities = new Map<string, { total: number; monthly: number[] }>()

  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCsvLine(line)
    // Skip rows where col 0 isn't a valid date DD/MM/YYYY
    const dateStr = (cols[0] || '').trim()
    const date = parseDate(dateStr)
    if (!date) continue

    const timeStr = (cols[1] || '').trim()
    const productName = (cols[2] || '').trim()
    const paymentStr = (cols[3] || '').trim().toLowerCase()
    const peopleStr = (cols[4] || '').trim()
    const priceStr = (cols[5] || '').trim()
    const commentStr = (cols[6] || '').trim()

    if (!productName) continue

    const time = parseTime(timeStr) || { h: 12, m: 0 }
    const price = parsePrice(priceStr)
    if (price === null || price <= 0) continue

    // Determine payment method
    let payment: 'cash' | 'card' = 'cash'
    if (paymentStr.includes('datafono') || paymentStr.includes('datáfono') || paymentStr.includes('tarjeta')) {
      payment = 'card'
    } else if (paymentStr.includes('efectivo')) {
      payment = 'cash'
    } else if (paymentStr.includes('evento')) {
      payment = 'cash' // treat eventos as cash
    } else {
      // default: skip if payment unknown
      continue
    }

    // Parse people: "Kawtar, Adri, Claudia" → ["Kawtar", "Adri", "Claudia"]
    const people = peopleStr
      .replace(/^"/, '')
      .replace(/"$/, '')
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && !p.match(/^\d/) && p.length > 1 && p.length < 30)

    for (const p of people) {
      // Clean up names
      const cleanName = p.replace(/^"|"$/g, '').trim()
      if (cleanName && cleanName.length > 1 && cleanName.length < 30 && !cleanName.match(/^\d/)) {
        peopleSet.add(cleanName)
      }
    }

    // Track product price (latest seen)
    productPrices.set(productName, price)
    const norm = normalizeProductName(productName)
    productNameVariants.set(norm, productName)

    // Combine date + time
    const fullDate = new Date(date)
    fullDate.setHours(time.h, time.m, 0, 0)

    sales.push({
      date: fullDate,
      time,
      productName,
      payment,
      people,
      price,
      comment: commentStr || undefined,
    })
  }

  // Parse right side of CSV (cols 10-18) for product catalog with monthly quantities
  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCsvLine(line)
    const catProductName = (cols[9] || '').trim()  // col index 9 = PRODUCTO (10th col, 0-indexed)
    if (!catProductName || catProductName.length < 2) continue
    // Skip junk rows (sentences pasted by mistake)
    if (catProductName.length > 60) continue
    if (catProductName.match(/^(por|que|solo|tomate|cafe|00|30|50|6€|7€)/i)) continue

    const monthly: number[] = []
    for (let i = 10; i <= 18; i++) {
      const v = parseInt((cols[i] || '0').trim(), 10)
      monthly.push(isNaN(v) ? 0 : v)
    }
    const total = monthly.reduce((s, v) => s + v, 0)
    if (total > 0) {
      productCatalogQuantities.set(catProductName, { total, monthly })
      // Also register as a known product variant
      const norm = normalizeProductName(catProductName)
      if (!productNameVariants.has(norm)) {
        productNameVariants.set(norm, catProductName)
      }
    }
  }

  console.log(`📊 CSV parseado: ${sales.length} ventas válidas, ${peopleSet.size} personas, ${productNameVariants.size} productos únicos`)

  // ---------- Crear admin ----------
  const admin = await db.user.create({
    data: {
      name: 'Admin La Cafeta',
      email: 'admin@lacafeta.com',
      password: '',
      role: 'ADMIN',
      isActive: true,
      customFields: '{}',
    },
  })
  console.log(`✓ Admin creado: ${admin.email}`)

  // ---------- Crear empleados (de PERSONAS del CSV) ----------
  // Filtrar nombres válidos
  const validPeople = Array.from(peopleSet).filter((n) => {
    const lower = n.toLowerCase()
    // Excluir palabras que no son nombres
    const excluded = ['datafono', 'efectivo', 'evento', 'adri', 'kawtar', 'claudia'] // keep these actually
    // Actually keep all short capitalized words that look like names
    return n.length > 1 && n.length < 30 && !n.match(/^\d/)
  })

  // Map para almacenar user.id por nombre
  const userByName = new Map<string, string>()
  for (const name of validPeople) {
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@lacafeta.com`
    try {
      const u = await db.user.create({
        data: {
          name,
          email,
          password: '',
          role: 'EMPLOYEE',
          isActive: true,
          customFields: '{}',
        },
      })
      userByName.set(name, u.id)
    } catch (e) {
      // email duplicate, skip
    }
  }
  console.log(`✓ ${userByName.size} empleados creados`)

  // Asegurar al menos un empleado de prueba (María García) si no hay empleados
  if (userByName.size === 0) {
    const maria = await db.user.create({
      data: {
        name: 'María García',
        email: 'maria@lacafeta.com',
        password: '',
        role: 'EMPLOYEE',
        isActive: true,
        customFields: '{}',
      },
    })
    userByName.set('María', maria.id)
    userByName.set('María García', maria.id)
  }

  // ---------- Crear turnos ----------
  const shiftManana = await db.shift.create({
    data: {
      name: 'Mañana',
      startTime: '07:00',
      endTime: '14:00',
      daysOfWeek: '1,2,3,4,5',
      openingProtocol: JSON.stringify([
        'Encender luces y equipo de cocina',
        'Revisar stock de productos perecederos',
        'Encender cafetera y calentar agua',
        'Preparar caja inicial (100€ en efectivo)',
        'Revisar protocolos del día',
        'Comprobar temperatura de la nevera',
        'Reponer productos del mostrador',
      ]),
      closingProtocol: JSON.stringify([
        'Cerrar caja y contar efectivo',
        'Limpiar superficies y utensilios',
        'Apagar cafetera y equipos',
        'Vaciar basura y reciclar',
        'Revisar stock para reposición',
        'Cerrar luces y puerta',
      ]),
    },
  })
  const shiftTarde = await db.shift.create({
    data: {
      name: 'Tarde',
      startTime: '14:00',
      endTime: '21:00',
      daysOfWeek: '1,2,3,4,5',
      openingProtocol: JSON.stringify([
        'Relevo con turno mañana: revisar pendientes',
        'Revisar stock de productos vendidos en mañana',
        'Reponer bebidas frías',
        'Verificar temperatura nevera',
        'Preparar caja del turno de tarde',
      ]),
      closingProtocol: JSON.stringify([
        'Cerrar caja y contar efectivo',
        'Limpiar cocina y mostrador',
        'Preparar pedido de reposición',
        'Apagar equipos',
        'Cerrar luces',
      ]),
    },
  })
  console.log(`✓ 2 turnos creados (Mañana, Tarde)`)

  // ---------- Crear productos ----------
  // Unificar productos: usar catálogo (col 10) como base + productos de ventas (col 3)
  const allProductNames = new Set<string>()
  for (const [display] of productNameVariants) {
    allProductNames.add(display)
  }
  // Also add raw display names from productNameVariants
  for (const display of productNameVariants.values()) {
    allProductNames.add(display)
  }

  const productByName = new Map<string, { id: string; price: number }>()
  // First, create products that have catalog quantities (these are the "official" products)
  for (const [name, info] of productCatalogQuantities) {
    const price = productPrices.get(name) ?? guessPrice(name)
    const tags = inferTags(name)
    // Determine stock: use the max monthly quantity as initial stock, minStock = 10% of total
    const maxMonthly = Math.max(...info.monthly)
    const stock = Math.max(maxMonthly, 20)
    const minStock = Math.max(Math.floor(info.total * 0.05), 5)
    const product = await db.product.create({
      data: {
        name,
        price,
        tags: JSON.stringify(tags),
        imageUrl: null,
        description: null,
        isActive: true,
        customFields: '{}',
        inventory: {
          create: {
            stock,
            minStock,
            unit: 'ud',
            customFields: '{}',
          },
        },
      },
    })
    productByName.set(name, { id: product.id, price })
    productByName.set(normalizeProductName(name), { id: product.id, price })
  }

  // Then create products that only appear in sales (COMIDA col) but not in catalog
  for (const [norm, display] of productNameVariants) {
    if (productByName.has(norm)) continue
    const price = productPrices.get(display) ?? guessPrice(display)
    const tags = inferTags(display)
    const product = await db.product.create({
      data: {
        name: display,
        price,
        tags: JSON.stringify(tags),
        imageUrl: null,
        description: null,
        isActive: true,
        customFields: '{}',
        inventory: {
          create: {
            stock: 30,
            minStock: 5,
            unit: 'ud',
            customFields: '{}',
          },
        },
      },
    })
    productByName.set(display, { id: product.id, price })
    productByName.set(norm, { id: product.id, price })
  }
  console.log(`✓ ${productByName.size / 2} productos creados (con inventario)`)

  // ---------- Crear protocolos ----------
  await db.protocol.create({
    data: {
      type: 'APERTURA',
      name: 'Apertura general cantina',
      description: 'Protocolo de apertura estándar',
      steps: JSON.stringify([
        'Abrir puerta y encender luces generales',
        'Encender equipos de cocina (plancha, horno)',
        'Encender cafetera industrial',
        'Revisar nevera: temperaturas y caducidades',
        'Reponer stock de productos en mostrador',
        'Preparar caja inicial con cambio',
        'Revisar reservas y pedidos del día',
      ]),
    },
  })
  await db.protocol.create({
    data: {
      type: 'CIERRE',
      name: 'Cierre general cantina',
      description: 'Protocolo de cierre estándar',
      steps: JSON.stringify([
        'Avisar últimos clientes 15 min antes',
        'Cerrar caja y cuadrar con sistema',
        'Limpiar cocina: plancha, freidora, superficies',
        'Lavar utensilios y guardar',
        'Vaciar basuras y reciclar',
        'Apagar cafetera y equipos',
        'Revisar que todo está apagado',
        'Cerrar puerta con llave',
      ]),
    },
  })
  await db.protocol.create({
    data: {
      type: 'COCINA',
      name: 'Preparación de sándwich mixto',
      description: 'Receta estándar de sándwich mixto',
      steps: JSON.stringify([
        'Cortar 2 rebanadas de pan de molde',
        'Untar mantequilla en una rebanada',
        'Añadir jamón york (2 lonchas)',
        'Añadir queso (1 loncha)',
        'Cerrar sándwich',
        'Tostar en plancha 2 min por lado',
        'Cortar en diagonal',
        'Servir en plato con servilleta',
      ]),
    },
  })
  await db.protocol.create({
    data: {
      type: 'COCINA',
      name: 'Preparación de bocadillo tortilla',
      description: 'Receta estándar',
      steps: JSON.stringify([
        'Cortar pan por la mitad',
        'Batir 2 huevos con sal',
        'Calentar sartén con aceite',
        'Cuajar tortilla (jugosa por dentro)',
        'Colocar tortilla en pan',
        'Cortar por la mitad',
        'Servir',
      ]),
    },
  })

  // Protocolo de producto para café con leche
  const cafeConLeche = productByName.get(normalizeProductName('Cafe con leche pequeño'))
  if (cafeConLeche) {
    await db.protocol.create({
      data: {
        type: 'PRODUCTO',
        name: 'Protocolo - Café con leche',
        description: 'Pasos para preparar un café con leche',
        steps: JSON.stringify([
          'Calentar taza',
          'Extraer café espresso (30ml)',
          'Calentar leche a 65°C',
          'Espumar leche',
          'Verter leche sobre café',
          'Servir inmediatamente',
        ]),
        productId: cafeConLeche.id,
      },
    })
  }
  console.log(`✓ 5 protocolos creados`)

  // ---------- Crear asignaciones de turno (por día y persona) ----------
  // Para cada venta, determinar turno (Mañana si hora < 14, Tarde si no) y asignar persona
  const assignmentMap = new Map<string, string>() // key: `${userId}-${dateStr}-${shiftId}` → assignmentId
  let assignmentsCreated = 0
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  for (const sale of sales) {
    const personName = sale.people[0]
    if (!personName) continue
    const userId = userByName.get(personName)
    if (!userId) continue

    const dateStr = sale.date.toISOString().slice(0, 10)
    const shiftId = sale.time.h < 14 ? shiftManana.id : shiftTarde.id
    const key = `${userId}-${dateStr}-${shiftId}`
    if (!assignmentMap.has(key)) {
      // Limit: max 2 per shift+date — but for seed we just create 1 per person+date+shift
      try {
        const a = await db.shiftAssignment.create({
          data: {
            shiftId,
            userId,
            date: dateStr,
            role: sale.time.h < 11 ? 'ANOTADOR' : 'COCINERO',
          },
        })
        assignmentMap.set(key, a.id)
        assignmentsCreated++
      } catch {
        // unique constraint or max-2 — skip
      }
    }
  }
  // Also create an assignment for today for at least one employee so the POS flow can be tested
  if (userByName.size > 0) {
    const firstUserId = Array.from(userByName.values())[0]
    try {
      await db.shiftAssignment.create({
        data: {
          shiftId: shiftManana.id,
          userId: firstUserId,
          date: todayStr,
          role: 'ANOTADOR',
        },
      })
      assignmentsCreated++
    } catch {
      // already exists
    }
  }
  console.log(`✓ ${assignmentsCreated} asignaciones de turno creadas`)

  // ---------- Crear ventas (SaleTransaction + SaleItem) ----------
  // Agrupar ventas por (persona + fecha + hora cercana) para crear transacciones con múltiples items
  // Simplificación: cada fila del CSV = 1 SaleTransaction con 1 SaleItem
  let salesCreated = 0
  let salesSkipped = 0
  // Procesar en lotes para no saturar SQLite
  const BATCH = 200
  for (let i = 0; i < sales.length; i += BATCH) {
    const batch = sales.slice(i, i + BATCH)
    await db.$transaction(
      batch.map((s) => {
        const personName = s.people[0]
        const userId = personName ? userByName.get(personName) : null
        // Match product
        const norm = normalizeProductName(s.productName)
        const productMatch = productByName.get(norm) || productByName.get(s.productName)
        return db.saleTransaction.create({
          data: {
            turnoId: 1,
            employeeId: userId || null,
            total: s.price,
            paymentMethod: s.payment,
            createdAt: s.date,
            items: {
              create: [
                {
                  productId: productMatch?.id || null,
                  productName: s.productName,
                  price: s.price,
                  quantity: 1,
                  priority: 0,
                  status: 'DELIVERED',
                },
              ],
            },
          },
        })
      })
    )
    salesCreated += batch.length
    if (salesCreated % 500 === 0) console.log(`  ...${salesCreated}/${sales.length} ventas creadas`)
  }
  console.log(`✓ ${salesCreated} ventas creadas (${salesSkipped} skipped)`)

  // ---------- Crear deudas (algunas de ejemplo) ----------
  if (userByName.size > 0) {
    const userIds = Array.from(userByName.values()).slice(0, 2)
    for (const uid of userIds) {
      await db.shiftDebt.create({
        data: {
          userId: uid,
          reason: 'Producto no cobrado (registro manual)',
          isPaid: false,
        },
      })
    }
    console.log(`✓ ${userIds.length} deudas creadas`)
  }

  // ---------- Materias primas (legacy) ----------
  const cafe = await db.rawMaterial.create({ data: { name: 'Café grano', unit: 'kg', stock: 5, minStock: 2 } })
  const leche = await db.rawMaterial.create({ data: { name: 'Leche', unit: 'L', stock: 20, minStock: 5 } })
  const pan = await db.rawMaterial.create({ data: { name: 'Pan molde', unit: 'ud', stock: 30, minStock: 10 } })
  const tortilla = await db.rawMaterial.create({ data: { name: 'Tortilla', unit: 'ud', stock: 8, minStock: 3 } })

  const cafeProduct = productByName.get(normalizeProductName('Cafe con leche pequeño'))
  if (cafeProduct) {
    await db.productRecipe.create({ data: { productId: cafeProduct.id, rawMaterialId: cafe.id, quantity: 0.02 } })
    await db.productRecipe.create({ data: { productId: cafeProduct.id, rawMaterialId: leche.id, quantity: 0.15 } })
  }
  const bocataTortilla = productByName.get(normalizeProductName('Bocata tortilla'))
  if (bocataTortilla) {
    await db.productRecipe.create({ data: { productId: bocataTortilla.id, rawMaterialId: pan.id, quantity: 1 } })
    await db.productRecipe.create({ data: { productId: bocataTortilla.id, rawMaterialId: tortilla.id, quantity: 0.5 } })
  }
  console.log(`✓ 4 materias primas + recetas creadas`)

  console.log(`\n✅ Seed completo con datos reales!`)
  console.log(`   - Admin: ${admin.email}`)
  console.log(`   - ${userByName.size} empleados (primer login empleado usa el primero)`)
  console.log(`   - ${productByName.size / 2} productos`)
  console.log(`   - ${salesCreated} ventas reales del CSV`)
  console.log(`   - ${assignmentsCreated} asignaciones de turno`)
}

// ---------- Helper: adivinar precio por nombre ----------
function guessPrice(name: string): number {
  const n = normalizeProductName(name)
  if (n.includes('pack')) return 3.5
  if (n.includes('bocata') || n.includes('sandwich')) return 3.5
  if (n.includes('cafe') && n.includes('grande')) return 1.8
  if (n.includes('cafe') && n.includes('pequeno')) return 1.2
  if (n.includes('cafe')) return 1.5
  if (n.includes('tostada')) return 2.0
  if (n.includes('pincho')) return 1.5
  if (n.includes('croissant')) return 1.5
  if (n.includes('gofre')) return 2.0
  if (n.includes('agua')) return 1.0
  if (n.includes('coca') || n.includes('cerveza')) return 1.3
  if (n.includes('redbull')) return 2.0
  if (n.includes('colacao') || n.includes('te')) return 1.5
  if (n.includes('tenedor') || n.includes('cuchillo')) return 0.2
  return 1.5
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
