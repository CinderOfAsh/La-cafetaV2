// Seed inicial para La Cafeta
import { db } from "../src/lib/db"

async function main() {
  console.log("🌱 Seeding La Cafeta...")

  // Limpiar datos existentes
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

  // ===== Users =====
  const admin = await db.user.create({
    data: {
      name: "Admin La Cafeta",
      email: "admin@lacafeta.com",
      password: "",
      role: "ADMIN",
      isActive: true,
      customFields: "{}",
    },
  })
  const empleado1 = await db.user.create({
    data: {
      name: "María García",
      email: "maria@lacafeta.com",
      password: "",
      role: "EMPLOYEE",
      isActive: true,
      customFields: "{}",
    },
  })
  const empleado2 = await db.user.create({
    data: {
      name: "Carlos Ruiz",
      email: "carlos@lacafeta.com",
      password: "",
      role: "COCINERO",
      isActive: true,
      customFields: "{}",
    },
  })
  const empleado3 = await db.user.create({
    data: {
      name: "Ana López",
      email: "ana@lacafeta.com",
      password: "",
      role: "ANOTADOR",
      isActive: true,
      customFields: "{}",
    },
  })

  console.log(`✓ Users: ${[admin, empleado1, empleado2, empleado3].length}`)

  // ===== Shifts =====
  const shiftManana = await db.shift.create({
    data: {
      name: "Mañana",
      startTime: "07:00",
      endTime: "14:00",
      daysOfWeek: "1,2,3,4,5",
      openingProtocol: JSON.stringify([
        "Encender luces y equipo de cocina",
        "Revisar stock de productos perecederos",
        "Encender cafetera y calentar agua",
        "Preparar caja inicial (100€ en efectivo)",
        "Revisar protocolos del día",
      ]),
      closingProtocol: JSON.stringify([
        "Cerrar caja y contar efectivo",
        "Limpiar superficies y utensilios",
        "Apagar cafetera y equipos",
        "Vaciar basura y reciclar",
        "Cerrar luces y puerta",
      ]),
    },
  })
  const shiftTarde = await db.shift.create({
    data: {
      name: "Tarde",
      startTime: "14:00",
      endTime: "21:00",
      daysOfWeek: "1,2,3,4,5",
      openingProtocol: JSON.stringify([
        "Relevo con turno mañana: revisar pendientes",
        "Revisar stock de productos vendidos en mañana",
        "Reponer bebidas frías",
        "Verificar temperatura nevera",
      ]),
      closingProtocol: JSON.stringify([
        "Cerrar caja y contar efectivo",
        "Limpiar cocina y mostrador",
        "Preparar pedido de reposición",
        "Cerrar luces",
      ]),
    },
  })

  console.log(`✓ Shifts: 2`)

  // ===== Products + Inventory =====
  const products = [
    { name: "Café con leche", price: 1.5, tags: ["Bebidas", "Café"], stock: 50, minStock: 10, unit: "ud" },
    { name: "Café americano", price: 1.2, tags: ["Bebidas", "Café"], stock: 40, minStock: 10, unit: "ud" },
    { name: "Cortado", price: 1.4, tags: ["Bebidas", "Café"], stock: 35, minStock: 10, unit: "ud" },
    { name: "Capuchino", price: 1.8, tags: ["Bebidas", "Café"], stock: 30, minStock: 8, unit: "ud" },
    { name: "Zumo de naranja", price: 2.0, tags: ["Bebidas", "Zumo"], stock: 20, minStock: 5, unit: "ud" },
    { name: "Té verde", price: 1.5, tags: ["Bebidas", "Té"], stock: 25, minStock: 5, unit: "ud" },
    { name: "Croissant", price: 1.2, tags: ["Bollería"], stock: 15, minStock: 8, unit: "ud" },
    { name: "Napolitana chocolate", price: 1.5, tags: ["Bollería"], stock: 12, minStock: 6, unit: "ud" },
    { name: "Magdalena", price: 0.9, tags: ["Bollería"], stock: 4, minStock: 6, unit: "ud" },
    { name: "Sándwich mixto", price: 3.5, tags: ["Sándwiches"], stock: 18, minStock: 5, unit: "ud" },
    { name: "Sándwich vegetal", price: 4.0, tags: ["Sándwiches"], stock: 15, minStock: 5, unit: "ud" },
    { name: "Bocadillo jamón", price: 4.5, tags: ["Bocadillos"], stock: 12, minStock: 5, unit: "ud" },
    { name: "Bocadillo tortilla", price: 4.0, tags: ["Bocadillos"], stock: 3, minStock: 5, unit: "ud" },
    { name: "Botella agua", price: 1.0, tags: ["Bebidas", "Agua"], stock: 60, minStock: 15, unit: "ud" },
    { name: "Refresco lata", price: 1.3, tags: ["Bebidas", "Refresco"], stock: 45, minStock: 12, unit: "ud" },
    { name: "Zumo natural", price: 2.5, tags: ["Bebidas", "Zumo"], stock: 8, minStock: 8, unit: "ud" },
  ]

  for (const p of products) {
    const product = await db.product.create({
      data: {
        name: p.name,
        price: p.price,
        tags: JSON.stringify(p.tags),
        imageUrl: null,
        description: null,
        isActive: true,
        customFields: "{}",
        inventory: {
          create: {
            stock: p.stock,
            minStock: p.minStock,
            unit: p.unit,
            customFields: "{}",
          },
        },
      },
    })
    // Protocolo de producto para café con leche
    if (p.name === "Café con leche") {
      await db.protocol.create({
        data: {
          type: "PRODUCTO",
          name: `Protocolo - ${p.name}`,
          description: "Pasos para preparar un café con leche",
          steps: JSON.stringify([
            "Calentar taza",
            "Extraer café espresso (30ml)",
            "Calentar leche a 65°C",
            "Espumar leche",
            "Verter leche sobre café",
            "Servir inmediatamente",
          ]),
          productId: product.id,
        },
      })
    }
  }

  console.log(`✓ Products: ${products.length}`)

  // ===== Protocols (Apertura/Cierre/Cocina) =====
  await db.protocol.create({
    data: {
      type: "APERTURA",
      name: "Apertura general cantina",
      description: "Protocolo de apertura estándar",
      steps: JSON.stringify([
        "Abrir puerta y encender luces generales",
        "Encender equipos de cocina (plancha, horno)",
        "Encender cafetera industrial",
        "Revisar nevera: temperaturas y caducidades",
        "Reponer stock de productos en mostrador",
        "Preparar caja inicial con cambio",
        "Revisar reservas y pedidos del día",
      ]),
    },
  })
  await db.protocol.create({
    data: {
      type: "CIERRE",
      name: "Cierre general cantina",
      description: "Protocolo de cierre estándar",
      steps: JSON.stringify([
        "Avisar últimos clientes 15 min antes",
        "Cerrar caja y cuadrar con sistema",
        "Limpiar cocina: plancha, freidora, superficies",
        "Lavar utensilios y guardar",
        "Vaciar basuras y reciclar",
        "Apagar cafetera y equipos",
        "Revisar que todo está apagado",
        "Cerrar puerta con llave",
      ]),
    },
  })
  await db.protocol.create({
    data: {
      type: "COCINA",
      name: "Preparación de sándwich mixto",
      description: "Receta estándar de sándwich mixto",
      steps: JSON.stringify([
        "Cortar 2 rebanadas de pan de molde",
        "Untar mantequilla en una rebanada",
        "Añadir jamón york (2 lonchas)",
        "Añadir queso (1 loncha)",
        "Cerrar sándwich",
        "Tostar en plancha 2 min por lado",
        "Cortar en diagonal",
        "Servir en plato con servilleta",
      ]),
    },
  })
  await db.protocol.create({
    data: {
      type: "COCINA",
      name: "Preparación de bocadillo tortilla",
      description: "Receta estándar",
      steps: JSON.stringify([
        "Cortar pan por la mitad",
        "Batir 2 huevos con sal",
        "Calentar sartén con aceite",
        "Cuajar tortilla (jugosa por dentro)",
        "Colocar tortilla en pan",
        "Cortar por la mitad",
        "Servir",
      ]),
    },
  })

  console.log(`✓ Protocols: 4`)

  // ===== Shift Assignments (hoy y días recientes) =====
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today.getTime() - 86400000).toISOString().slice(0, 10)
  const tomorrow = new Date(today.getTime() + 86400000).toISOString().slice(0, 10)

  await db.shiftAssignment.create({
    data: { shiftId: shiftManana.id, userId: empleado1.id, date: todayStr, role: "ANOTADOR" },
  })
  await db.shiftAssignment.create({
    data: { shiftId: shiftManana.id, userId: empleado2.id, date: todayStr, role: "COCINERO" },
  })
  await db.shiftAssignment.create({
    data: { shiftId: shiftTarde.id, userId: empleado3.id, date: todayStr, role: "ANOTADOR" },
  })
  await db.shiftAssignment.create({
    data: { shiftId: shiftManana.id, userId: empleado1.id, date: yesterday, role: "ANOTADOR" },
  })
  await db.shiftAssignment.create({
    data: { shiftId: shiftTarde.id, userId: empleado3.id, date: tomorrow, role: "ANOTADOR" },
  })

  console.log(`✓ ShiftAssignments: 5`)

  // ===== Sales (algunas ventas de hoy y ayer) =====
  const prods = await db.product.findMany()
  const findP = (name: string) => prods.find((p) => p.name === name)!

  const sales = [
    { employeeId: empleado1.id, payment: "cash", date: new Date(today.getTime() - 7200000), items: [
      { p: findP("Café con leche"), qty: 2 },
      { p: findP("Croissant"), qty: 1 },
    ]},
    { employeeId: empleado1.id, payment: "card", date: new Date(today.getTime() - 5400000), items: [
      { p: findP("Sándwich mixto"), qty: 1 },
      { p: findP("Botella agua"), qty: 1 },
    ]},
    { employeeId: empleado2.id, payment: "cash", date: new Date(today.getTime() - 3600000), items: [
      { p: findP("Bocadillo jamón"), qty: 1 },
      { p: findP("Refresco lata"), qty: 1 },
    ]},
    { employeeId: empleado1.id, payment: "card", date: new Date(today.getTime() - 1800000), items: [
      { p: findP("Capuchino"), qty: 1 },
      { p: findP("Napolitana chocolate"), qty: 1 },
    ]},
    { employeeId: empleado3.id, payment: "cash", date: new Date(today.getTime() - 86400000 + 36000000), items: [
      { p: findP("Café americano"), qty: 3 },
      { p: findP("Magdalena"), qty: 2 },
    ]},
  ]

  for (const s of sales) {
    const items = s.items.map((it, idx) => ({
      productId: it.p.id,
      productName: it.p.name,
      price: it.p.price,
      quantity: it.qty,
      priority: idx,
      status: "DELIVERED" as const,
    }))
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    await db.saleTransaction.create({
      data: {
        turnoId: 1,
        employeeId: s.employeeId,
        total,
        paymentMethod: s.payment,
        createdAt: s.date,
        items: { create: items },
      },
    })
  }

  console.log(`✓ Sales: ${sales.length}`)

  // ===== Shift Debt =====
  await db.shiftDebt.create({
    data: { userId: empleado1.id, reason: "Café no cobrado (3 unidades)", isPaid: false },
  })
  await db.shiftDebt.create({
    data: { userId: empleado3.id, reason: "Producto caducado por mala rotación", isPaid: false },
  })

  console.log(`✓ ShiftDebts: 2`)

  // ===== Raw Materials (legacy) =====
  const cafe = await db.rawMaterial.create({ data: { name: "Café grano", unit: "kg", stock: 5, minStock: 2 } })
  const leche = await db.rawMaterial.create({ data: { name: "Leche", unit: "L", stock: 20, minStock: 5 } })
  const pan = await db.rawMaterial.create({ data: { name: "Pan molde", unit: "ud", stock: 30, minStock: 10 } })

  const cafeConLeche = await db.product.findFirst({ where: { name: "Café con leche" } })
  if (cafeConLeche) {
    await db.productRecipe.create({ data: { productId: cafeConLeche.id, rawMaterialId: cafe.id, quantity: 0.02 } })
    await db.productRecipe.create({ data: { productId: cafeConLeche.id, rawMaterialId: leche.id, quantity: 0.15 } })
  }
  const sandwich = await db.product.findFirst({ where: { name: "Sándwich mixto" } })
  if (sandwich) {
    await db.productRecipe.create({ data: { productId: sandwich.id, rawMaterialId: pan.id, quantity: 2 } })
  }

  console.log(`✓ RawMaterials: 3, Recipes: 3`)
  console.log(`✅ Seed completo!`)
  console.log(`   Admin: ${admin.email} (id=${admin.id})`)
  console.log(`   Empleado: ${empleado1.email} (id=${empleado1.id})`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
