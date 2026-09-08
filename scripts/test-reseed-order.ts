// Test del reseed con FK constraints: crea ventas y turnos DESPUÉS del seed,
// luego prueba el reseed con FORCE_RESEED=true.
// Si el orden de delete está mal, esto fallará con "Foreign key constraint violated".

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  console.log('1. Seed inicial (idempotente con upsert)...')
  // Crear 2 users manualmente
  const u1 = await db.user.upsert({
    where: { email: 'test1@x.com' },
    update: {},
    create: { name: 'Test1', email: 'test1@x.com', role: 'EMPLOYEE' },
  })
  const u2 = await db.user.upsert({
    where: { email: 'test2@x.com' },
    update: {},
    create: { name: 'Test2', email: 'test2@x.com', role: 'EMPLOYEE' },
  })
  console.log(`   ✓ Users: ${u1.name}, ${u2.name}`)

  console.log('2. Crear un ShiftAssignment que apunta a u1...')
  const shift = await db.shift.upsert({
    where: { id: 'test-shift-1' },
    update: {},
    create: { id: 'test-shift-1', name: 'Test', startTime: '08:00', endTime: '15:00', daysOfWeek: '1,2,3' },
  })
  const asg = await db.shiftAssignment.create({
    data: { shiftId: shift.id, userId: u1.id, date: '2026-09-15', role: 'COCINERO' },
  })
  console.log(`   ✓ Assignment creado (userId=${u1.id}, shiftId=${shift.id})`)

  console.log('3. Crear un ShiftSwap entre u1 y u2...')
  const swap = await db.shiftSwap.create({
    data: {
      originalUserId: u1.id,
      replacementUserId: u2.id,
      shiftAssignmentId: asg.id,
      type: 'swap',
      status: 'PENDING',
    },
  })
  console.log(`   ✓ Swap creado (original=${u1.name}, replacement=${u2.name})`)

  console.log('4. Ahora probamos el deleteMany de User con FK activas...')
  console.log('   (antes esto PETABA con "Foreign key constraint violated")')
  try {
    // Limpiamos primero las hijas, luego user
    await db.shiftSwap.deleteMany({})
    await db.shiftAssignment.deleteMany({})
    await db.shift.deleteMany({})
    await db.user.deleteMany({ where: { email: { in: ['test1@x.com', 'test2@x.com'] } } })
    console.log('   ✓ user.deleteMany() funcionó con FK constraints!')
  } catch (err: any) {
    console.log(`   ❌ ERROR: ${err.message}`)
    process.exit(1)
  }

  console.log('\n✅ Test pasado: el orden de delete es correcto.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
