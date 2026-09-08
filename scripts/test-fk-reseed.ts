// Simula la BD de Hostinger: añade ventas y turnos DESPUÉS del seed inicial,
// luego prueba el reseed (debe poder borrar todo correctamente).
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  console.log('Estado inicial de la BD:')
  const uCount = await db.user.count()
  const pCount = await db.product.count()
  const saCount = await db.shiftAssignment.count()
  console.log(`  users=${uCount}, products=${pCount}, shiftAssignments=${saCount}`)

  // Cogemos un usuario y un producto existentes
  const user = await db.user.findFirst()
  const product = await db.product.findFirst()
  if (!user || !product) {
    console.log('No hay users/products, ejecuta el reseed primero')
    return
  }

  // Creamos una venta (que tiene FK a user)
  console.log('\n1. Creando una venta para user=' + user.name + '...')
  const sale = await db.saleTransaction.create({
    data: {
      employeeId: user.id,
      total: 1.50,
      paymentMethod: 'cash',
      items: { create: [{ productId: product.id, productName: product.name, price: 1.50, quantity: 1, priority: 0, status: 'DELIVERED' }] },
    },
  })
  console.log(`  ✓ Venta creada (id=${sale.id})`)

  // Creamos un shift assignment
  console.log('2. Creando un ShiftAssignment extra para user=' + user.name + '...')
  const shift = await db.shift.findFirst()
  if (shift) {
    const asg = await db.shiftAssignment.create({
      data: { shiftId: shift.id, userId: user.id, date: '2026-10-15', role: 'CAMARERO' },
    })
    console.log(`  ✓ ShiftAssignment creado (id=${asg.id})`)

    // Creamos un swap
    console.log('3. Creando un ShiftSwap entre 2 users...')
    const user2 = await db.user.findFirst({ where: { id: { not: user.id } } })
    if (user2) {
      const swap = await db.shiftSwap.create({
        data: {
          originalUserId: user.id,
          replacementUserId: user2.id,
          shiftAssignmentId: asg.id,
          type: 'swap',
          status: 'PENDING',
        },
      })
      console.log(`  ✓ ShiftSwap creado (id=${swap.id})`)
    }
  }

  console.log('\n2. AHORA probamos el deleteMany de User con FK activas...')
  console.log('   Esto era lo que PETABA en Hostinger.')
  try {
    // Simulo el orden del ensure-db.ts actual (CORREGIDO)
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
    console.log('   ✓ user.deleteMany() OK con FK activas!')
  } catch (err: any) {
    console.log(`   ❌ ERROR: ${err.message}`)
    process.exit(1)
  }

  console.log('\n✅ Test pasado: el orden de delete permite borrar con FK activas.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
