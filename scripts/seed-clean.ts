// Seed La Cafeta v3 — plantilla real + turnos correctos, BD limpia para test
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Poblando La Cafeta (v3 - plantilla real + turnos correctos)...')

  // Limpiar todo
  await db.protocolCompletion.deleteMany()
  await db.protocol.deleteMany()
  await db.productRecipe.deleteMany()
  await db.rawMaterial.deleteMany()
  await db.saleItem.deleteMany()
  await db.saleTransaction.deleteMany()
  await db.shiftSwap.deleteMany()
  await db.shiftAssignment.deleteMany()
  await db.shift.deleteMany()
  await db.purchaseItem.deleteMany()
  await db.purchase.deleteMany()
  await db.product.deleteMany()
  await db.user.deleteMany()

  // ===== Admin =====
  const admin = await db.user.create({
    data: {
      name: 'Bullerre',
      email: 'bullerre@lacafeta.com',
      password: '',
      role: 'ADMIN',
      isActive: true,
      customFields: '{}',
    },
  })
  console.log(`✓ Admin: ${admin.name} <${admin.email}>`)

  // ===== Empleados (16) =====
  const employeeNames = [
    'Aitana',
    'Angel',
    'Adrian',
    'Bakr',
    'Claudia',
    'Diego S',
    'Diego V',
    'Elías',
    'Hugo A',
    'Jose G',
    'Javier G',
    'Javier D',
    'Kawtar',
    'Sofía',
    'Luca',
    'Vittorio',
  ]

  const employees: { id: string; name: string }[] = []
  for (const name of employeeNames) {
    // Email: primer nombre en lowercase, sin acentos ni espacios, @lacafeta.com
    const emailLocal = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '')
    const u = await db.user.create({
      data: {
        name,
        email: `${emailLocal}@lacafeta.com`,
        password: '',
        role: 'EMPLOYEE',
        isActive: true,
        customFields: '{}',
      },
    })
    employees.push({ id: u.id, name: u.name })
  }
  console.log(`✓ ${employees.length} empleados creados`)

  // ===== Turnos (L-V, 8:45-13 y 13-17) =====
  const shiftManana = await db.shift.create({
    data: {
      name: 'Mañana',
      startTime: '08:45',
      endTime: '13:00',
      daysOfWeek: '1,2,3,4,5', // L-V
      openingProtocol: JSON.stringify([
        'Encender luces y equipo de cocina',
        'Encender cafetera y calentar agua',
        'Revisar stock de productos perecederos',
        'Preparar caja inicial (100€ en efectivo)',
        'Comprobar temperatura de la nevera',
        'Revisar protocolos del día',
      ]),
      closingProtocol: JSON.stringify([
        'Cuadrar caja del turno de mañana',
        'Revisar stock y anotar reposiciones necesarias',
        'Limpiar superficies de trabajo',
        'Relevo con turno de tarde: comentar pendientes',
      ]),
    },
  })
  const shiftTarde = await db.shift.create({
    data: {
      name: 'Tarde',
      startTime: '13:00',
      endTime: '17:00',
      daysOfWeek: '1,2,3,4,5', // L-V
      openingProtocol: JSON.stringify([
        'Relevo con turno de mañana: revisar pendientes',
        'Revisar stock de productos vendidos en mañana',
        'Reponer bebidas frías',
        'Verificar temperatura nevera',
        'Preparar caja del turno de tarde',
      ]),
      closingProtocol: JSON.stringify([
        'Cerrar caja y contar efectivo',
        'Limpiar cocina y mostrador',
        'Apagar cafetera y equipos',
        'Preparar pedido de reposición si hace falta',
        'Cerrar luces y puerta',
      ]),
    },
  })
  console.log(`✓ 2 turnos: Mañana (08:45-13:00) y Tarde (13:00-17:00), L-V`)
  console.log(`  → SIN asignaciones de turno (para test de UX)`)

  // ===== Protocolos generales =====
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
        'Cerrar puerta con llave',
      ]),
    },
  })
  console.log(`✓ 2 protocolos generales (apertura + cierre)`)

  console.log(`\n✅ Seed completo!`)
  console.log(`   - Admin: ${admin.name} (bullerre@lacafeta.com)`)
  console.log(`   - ${employees.length} empleados`)
  console.log(`   - 2 turnos sin asignar (test de UX)`)
  console.log(`   - 0 productos (test de UX)`)
  console.log(`   - 0 materias primas (test de UX)`)
  console.log(`\n   Para asignar turnos: Admin → Gestión de Personal → Empleados → Asignar turnos`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
