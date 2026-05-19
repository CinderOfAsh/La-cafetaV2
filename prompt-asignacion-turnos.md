# PROMPT — ASIGNACIÓN DE TURNOS

## OBJETIVO
Arreglar y mejorar el sistema de asignación de turnos con los siguientes cambios:

## CAMBIOS

### 1. LÍMITE DE 2 PERSONAS POR TURNO
En `src/app/api/shift-assignments/route.ts` y `src/app/api/shift-assignments/batch/route.ts`, ANTES de crear una asignación, verificar que no haya ya 2 personas asignadas al mismo `shiftId` + `date`. Si ya hay 2, devolver error 400 con mensaje "Este turno ya tiene 2 personas asignadas (cupo completo)".

### 2. COLORS EN CALENDARIO DE ASIGNACIÓN (admin/personal/asignar/[userId])
Modificar `src/app/app/admin/personal/asignar/[userId]/page.tsx` para que:
- Cuando se muestre un día, mostrar en la celda del calendario los turnos disponibles para ese día (considerando `daysOfWeek`)
- Para cada turno disponible, indicar cuántas personas están asignadas:
  - **VERDE/OCIO**: 0 personas asignadas (disponible)
  - **AMARILLO**: 1 persona asignada (queda 1 cupo)
  - **ROJO**: 2 personas asignadas (completo)
- El usuario administrador debe poder ver esto incluso sin hacer clic en editar — debe ser visible en la celda del día

### 3. MENSAJE DE BIENVENIDA EN PANEL DE EMPLEADO
Modificar `src/app/turno/page.tsx` para que cuando el empleado entre y tenga un turno asignado hoy:
- Mostrar un mensaje de bienvenida grande al inicio: "Bienvenido, [nombre del empleado]" 
- Debajo: "Tienes el turno de [nombre del turno] ([hora inicio] - [hora fin]) como [rol]"
- Si no tiene turno asignado hoy, mostrar: "Hoy no tienes turno asignado. Puedes vender igualmente."
- El mensaje debe aparecer al cargar la página, antes que cualquier otra cosa

### 4. ARREGLAR VISIBILIDAD DE ASIGNACIONES
En `src/app/admin/personal/asignar/[userId]/page.tsx`, asegurar que el `saveAll()` y el batch endpoint funcionan correctamente. El problema potencial es que el batch endpoint podría fallar silenciosamente. Añadir manejo de errores:
- Si `saveAll()` falla, mostrar toast/error visible
- Refrescar la lista de asignaciones tras guardar

Además, verificar que `src/app/turno/page.tsx` carga correctamente las asignaciones del usuario logueado. Si el endpoint `/api/shift-assignments?date=XXXX` devuelve resultados, el filtro `mine = list.find((a) => a.userId === me.id)` debería funcionar.

### 5. NO TOCAR
- No cambiar nada del diseño visual (colores, fuentes, animaciones)
- No cambiar el schema de Prisma
- No eliminar funcionalidad existente
- Mantener TODO el código existente

## ARCHIVOS A MODIFICAR
1. `src/app/api/shift-assignments/route.ts` — Añadir validación de límite 2 personas
2. `src/app/api/shift-assignments/batch/route.ts` — Añadir validación de límite 2 personas
3. `src/app/admin/personal/asignar/[userId]/page.tsx` — Colores en calendario, disponibilidad visible, mejor manejo de errores
4. `src/app/turno/page.tsx` — Mensaje de bienvenida

## TESTING
1. `npm run build` — debe pasar
2. Asignar 2 personas al mismo turno/fecha → error al intentar 3ª
3. Ver colores en calendario: verde (0), amarillo (1), rojo (2)
4. Entrar como empleado con turno → ver mensaje de bienvenida
5. Entrar como empleado sin turno → ver mensaje de "sin turno"
