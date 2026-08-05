# La Cafeta ☕

Sistema de gestión integral para cafetería: punto de venta, turnos de empleados, inventario, protocolos de apertura/cierre y dashboard.

## Funcionalidades

- **POS / Mi Turno** — ventas con control de inventario, bienvenida por turno activo
- **Turnos** — gestión de turnos, asignaciones (máx. 2 personas), intercambios con aprobación
- **Personal** — empleados, roles, dashboard individual
- **Productos** — catálogo con precios, recetas (materias primas) y stock
- **Inventario / Compras** — materias primas, lista de la compra, conciliación de facturas
- **Protocolos** — checklists de apertura/cierre por turno con completado diario
- **Dashboard** — ventas, productos estrella, stock crítico, estadísticas por empleado
- **Calendario** — planificación visual de turnos

## Stack

- Next.js 16 (App Router, standalone) + React 19
- Tailwind CSS 4 + shadcn/ui
- Prisma + SQLite
- Auth JWT (httpOnly cookie), timezone Madrid

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
```

## Producción

```bash
npm run build      # genera .next/standalone
npm run start
```

Variables de entorno:

- `DATABASE_URL` — ruta de la BD SQLite
- `JWT_SECRET` — clave secreta para firmar tokens (¡obligatoria en producción!)
