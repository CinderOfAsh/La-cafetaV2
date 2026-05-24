# 🏗️ PROMPT BASE 44 — DOCUMENTACIÓN COMPLETA DE LA WEBAPP "LA CAFETA"

## 📋 OBJETIVO
Proporcionar una descripción **extremadamente detallada** de todas las funciones, páginas, APIs, navegación, modelo de datos y flujos de la aplicación de gestión de cantina "La Cafeta".

> **Dirigido a**: modelos de IA o desarrolladores que necesiten entender o modificar la app desde cero.

---

## 🧭 1. ARQUITECTURA GENERAL

### 1.1 Stack tecnológico
| Capa | Tecnología |
|------|-----------|
| Framework | Next.js (App Router) |
| Lenguaje | TypeScript |
| Base de datos | SQLite (via Prisma ORM) |
| CSS | Tailwind CSS v4 |
| Fuentes | Inter + Crimson Text |
| Iconos | lucide-react |
| Autenticación | Cookies HTTP-only (JWT casero en `src/lib/auth.ts`) |

### 1.2 Estructura de directorios
```
web/
├── prisma/
│   └── schema.prisma          ← Modelo de datos completo
├── public/
│   └── assets/
│       ├── noise-texture.svg  ← Textura decorativa (overlay)
│       ├── deco-blob-1.svg    ← Decoración orgánica (verde salvia)
│       └── deco-blob-2.svg    ← Decoración orgánica (verde salvia)
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← Layout raíz (fuentes, elementos decorativos)
│   │   ├── page.tsx           ← Redirige a /login
│   │   ├── globals.css        ← Estilos globales + clases wellness
│   │   ├── decorative-elements.tsx  ← Componente de textura + blobs decorativos
│   │   ├── login/             ← Página de login
│   │   ├── hub-admin/         ← Hub del administrador
│   │   ├── hub-empleado/      ← Hub del empleado
│   │   ├── admin/             ← Panel de administración
│   │   │   ├── layout.tsx     ← Layout admin (back button + theme toggle)
│   │   │   ├── productos/     ← CRUD productos con stock e inventario
│   │   │   ├── personal/      ← Empleados, turnos, deudas
│   │   │   │   └── asignar/[userId]/  ← Calendario asignación turnos
│   │   │   ├── protocolos/    ← Protocolos (apertura/cierre/cocina/producto)
│   │   │   ├── dashboard/     ← Dashboard de métricas globales
│   │   │   ├── sandbox/       ← Simulador de ventas y protocolos
│   │   │   └── materias-primas/ ← CRUD materias primas (legacy)
│   │   └── turno/             ← Panel del empleado (POS)
│   │       ├── layout.tsx     ← Layout turno (back button)
│   │       ├── page.tsx       ← Punto de venta (POS) principal
│   │       ├── calendario/    ← Calendario de turnos con intercambios
│   │       └── dashboard/     ← Estadísticas personales del empleado
│   └── components/            ← Componentes reutilizables
│       └── ThemeToggle.tsx    ← Toggle claro/oscuro
```

### 1.3 Esquema de navegación completo
```
/login
  ├── /api/auth/login-admin   → Redirige → /hub-admin
  └── /api/auth/login-employee → Redirige → /hub-empleado

/hub-admin
  ├── /admin/productos         ← Productos + Inventario + Materias Primas
  ├── /admin/materias-primas   ← (legacy, se eliminó de hub)
  ├── /admin/personal          ← Empleados + Turnos + Deudas
  │   └── /admin/personal/asignar/[userId]  ← Asignación de turnos (calendario)
  ├── /admin/protocolos        ← Protocolos (4 tipos)
  ├── /admin/dashboard         ← Dashboard global admin
  └── /admin/sandbox           ← Simulador POS

/hub-empleado
  ├── /turno                   ← POS (Punto de Venta)
  ├── /turno/calendario        ← Calendario de turnos + intercambios
  └── /turno/dashboard         ← Dashboard personal

/api/auth/logout               ← Cierra sesión
```

---

## 🔐 2. SISTEMA DE AUTENTICACIÓN

### 2.1 Login (sin contraseña real)
- **Página**: `/login` — servidor estático, dos enlaces `<a>`
- **Admin**: `/api/auth/login-admin` → crea token JWT con `{ userId: 1, role: "ADMIN" }`, cookie `token` HTTP-only, redirige a `/hub-admin`
- **Employee**: `/api/auth/login-employee` → crea token JWT con `{ userId: 2, role: "EMPLOYEE" }`, redirige a `/hub-empleado`
- **Logout**: `/api/auth/logout` (GET) → borra cookie `token`, redirige a `/login`
- **Verificación**: `/api/auth/me` → devuelve `{ id, name, email, role }` del usuario autenticado

### 2.2 Middleware
- No hay middleware explícito visible; la autenticación se maneja vía API routes con la cookie `token`

---

## 👑 3. HUB ADMIN — `/hub-admin`

### 3.1 Página principal
- Header con logo "La Cafeta", ThemeToggle, botón Cerrar sesión
- Grid de 6 cards con iconos:
  1. **Productos** → `/admin/productos`
  2. **Materias Primas** → `/admin/materias-primas` (legacy)
  3. **Gestión de Personal** → `/admin/personal`
  4. **Protocolos** → `/admin/protocolos`
  5. **Dashboard** → `/admin/dashboard`
  6. **Sandbox** → `/admin/sandbox`

### 3.2 Layout admin
- Barra superior con botón "← Volver al Hub" + ThemeToggle
- Contenido anidado en `main`

---

## 📦 4. ADMIN PRODUCTOS — `/admin/productos`

### 4.1 Funcionalidad completa
- **Dos tabs**: Productos | Inventario
- **Búsqueda por nombre** (barra con lupa)
- **Exportar CSV** de productos

### 4.2 Tab: Productos
- Tabla con: Nombre, Precio, Tags, Activo, Acciones (editar/eliminar)
- **Modal de creación/edición**:
  - Nombre, Precio, Tags (texto separado por comas/JSON), Descripción, Imagen URL
  - Subida de imagen (multipart/form-data a `/api/upload`)
  - Campos personalizados (clave/valor dinámicos)
  - **Receta**: lista de materias primas + cantidad (via `ProductRecipe`)

### 4.3 Tab: Inventario
- Lista items de inventario vinculados a productos
- Edición inline: stock, minStock, unidad
- Campos personalizados
- Indicador visual cuando stock < minStock

### 4.4 APIs de productos
| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/products` | Listar productos (query `active=true` para filtrar) |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/[id]` | Actualizar producto |
| DELETE | `/api/products/[id]` | Eliminar producto |
| GET/POST/PUT | `/api/products/[id]/recipes` | Gestionar receta (ingredientes) |
| GET | `/api/inventory` | Listar inventario |
| PUT | `/api/inventory/[id]` | Actualizar item inventario |

---

## 👥 5. ADMIN PERSONAL — `/admin/personal`

### 5.1 Funcionalidad completa
- **Tres tabs**: Empleados | Turnos | Deudas
- **Búsqueda por nombre**

### 5.2 Tab: Empleados
- Tabla con: ID, Nombre, Email, Rol, Activo, Creado, Acciones
- **Modal creación/edición**: nombre, email, contraseña, rol (ADMIN/EMPLOYEE/COCINERO/ANOTADOR)
- Campos personalizados (clave/valor)
- **Exportar CSV**
- **Enlace "Asignar turnos"** → `/admin/personal/asignar/[userId]`
- Botón para añadir deuda (modal con razón)

### 5.3 Tab: Turnos
- Lista de turnos con: Nombre, Horario, Días de la semana, Acciones
- **Modal creación/edición**:
  - Nombre, hora inicio, hora fin
  - Días de la semana (checkboxes: D L M X J V S)
  - **Protocolo de apertura** (lista de pasos)
  - **Protocolo de cierre** (lista de pasos)
  - Vista de asignaciones del día actual: cuántas personas asignadas

### 5.4 Tab: Deudas
- Lista de deudas con: empleado, razón, pagada, fecha
- Botón marcar como pagada (`/api/shift-debts/[id]/pay`)

### 5.5 APIs de personal
| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/[id]` | Actualizar usuario |
| DELETE | `/api/users/[id]` | Eliminar usuario |
| GET | `/api/shifts` | Listar turnos |
| POST | `/api/shifts` | Crear turno |
| PUT | `/api/shifts/[id]` | Actualizar turno |
| DELETE | `/api/shifts/[id]` | Eliminar turno |
| GET | `/api/shift-assignments` | Listar asignaciones (query `date=YYYY-MM-DD`) |
| POST | `/api/shift-assignments` | Crear asignación |
| DELETE | `/api/shift-assignments/[id]` | Eliminar asignación |
| POST | `/api/shift-assignments/batch` | Batch (crear/eliminar varias) |
| GET | `/api/shift-debts` | Listar deudas |
| POST | `/api/shift-debts` | Crear deuda |
| PUT | `/api/shift-debts/[id]/pay` | Marcar como pagada |

### 5.6 Asignación de turnos — `/admin/personal/asignar/[userId]`
- **Vista calendario** (mes actual, navegación ← →)
- **Límite de 2 personas por turno+fecha**
- **Indicadores de disponibilidad por colores** en las celdas:
  - 🟢 Verde = 0 personas asignadas (disponible)
  - 🟡 Amarillo = 1 persona (queda 1 cupo)
  - 🔴 Rojo = 2 personas (completo)
- Click en un día → modal para asignar turno con: selector de turno, rol
- Botón de edición/eliminación de asignaciones existentes
- Botón "Guardar cambios" envía batch al backend
- Toasts de error/success

---

## 📋 6. ADMIN PROTOCOLOS — `/admin/protocolos`

### 6.1 Tipos de protocolo
1. **APERTURA** — Protocolo de apertura (pasos a seguir al abrir la cantina)
2. **CIERRE** — Protocolo de cierre (pasos al cerrar)
3. **COCINA** — Protocolos de cocina (recetas, preparaciones)
4. **PRODUCTO** — Protocolos vinculados a un producto específico

### 6.2 Navegación
- **Tres pestañas**:
  - **Apertura y Cierre** → lista filtrada por tipo APERTURA/CIERRE
  - **Cocina** → filtrado por tipo COCINA (con badge contador)
  - **Producto** → filtrado por tipo PRODUCTO

### 6.3 Funcionalidad
- Tabla con: Nombre, Tipo, Pasos (count), Acciones
- **Modal creación/edición**:
  - Tipo (select: APERTURA/CIERRE/COCINA/PRODUCTO)
  - Nombre
  - Descripción
  - Pasos (textarea, uno por línea)
- **Editor especial de cocina**: inline, lista de pasos editables con añadir/eliminar/reordenar

### 6.4 APIs de protocolos
| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/protocols` | Listar protocolos |
| POST | `/api/protocols` | Crear protocolo |
| PUT | `/api/protocols/[id]` | Actualizar protocolo |
| DELETE | `/api/protocols/[id]` | Eliminar protocolo |
| POST | `/api/protocols/[id]/complete` | Marcar completado |

---

## 📊 7. ADMIN DASHBOARD — `/admin/dashboard`

### 7.1 Filtro por fechas
- Selectores de fecha "Desde" y "Hasta"
- Recarga automática al cambiar fechas

### 7.2 KPIs principales (5 tarjetas)
1. **Ventas totales** (💰 en verde salvia) — suma de importe
2. **Transacciones** (🛒 en morado) — número de ventas
3. **Productos vendidos** (📈 en azul) — cantidad total
4. **Producto estrella** (⭐ en verde) — más vendido + unidades
5. **Stock crítico** (⚠️ en rojo) — productos con stock < minStock

### 7.3 Top 3 empleados
- Ranking con medallas (🥇🥈🥉)
- Nombre, número de ventas, importe total

### 7.4 Gráficos y tablas
- **Ventas por hora**: barras horizontales, separado cash/card
- **Métodos de pago**: efectivo vs tarjeta con porcentajes
- **Productos más vendidos** (top 10): cantidad, ingresos
- **Stock crítico**: lista productos con stock bajo (rojo)
- **Cambios de turno** (swaps): lista de intercambios realizados
- **Deudas pendientes**: lista deudas sin pagar

### 7.5 Exportación
- Botón "Exportar CSV" → descarga ventas del período

### 7.6 API
| Ruta | Función |
|------|---------|
| `/api/dashboard/stats?startDate=X&endDate=X` | Todas las stats |
| `/api/export/sales?start=X&end=X` | Export CSV |

---

## 🧪 8. ADMIN SANDBOX — `/admin/sandbox`

### 8.1 Propósito
Simulador del POS (punto de venta) para administradores — probar ventas y protocolos sin afectar datos reales.

### 8.2 Funcionalidad completa (espejo del POS real)
- **Pizarra de productos** con drag & drop
- **Tabs de filtros** por tags (pestañas tipo bookmark)
- **Barra de búsqueda** con lupa
- **Comandas simuladas**: productos pendientes con prioridad
- **Modal de venta**: seleccionar efectivo o tarjeta
- **Modal de protocolo**: ver pasos de apertura/cierre
- **Botones añadir comanda**, marcar como entregado, eliminar
- **Reordenar prioridades** con flechas ↑ ↓
- **Totals**: total vendido, efectivo, tarjeta

### 8.3 Diferencias con POS real
- Usa IDs de comanda tipo string (no relacionados con BD real)
- Tiene modal específico de protocolo de apertura/cierre
- No requiere turno activo

---

## 💳 9. POS (PUNTO DE VENTA) — `/turno`

### 9.1 Página principal

#### 9.1.1 Bienvenida y turno
- Navegación: layout con botón ← Volver al Hub
- Si el empleado TIENE turno asignado hoy:
  - Banner verde salvia con: "Bienvenido, [nombre]"
  - Detalle: turno, horario, rol (Anotador/Cocinero)
  - **Protocolo de apertura**: pasos numerados en verde
  - **Protocolo de cierre**: pasos numerados en ámbar
- Si NO tiene turno:
  - Banner gris con: "No tienes turno asignado hoy. Puedes realizar ventas de todas formas."

#### 9.1.2 Pizarra de productos
- **Filtros tipo bookmark** (pestañas): "Todos" + tags de productos
- **Barra de búsqueda** con lupa y botón X para limpiar
- **Productos en tarjetas**: imagen, nombre, precio
- **Drag & drop**: reorganizar tarjetas libremente (arrastrar y soltar)
- Si hay filtro o búsqueda activa, se desactiva el drag (para evitar confusiones)
- Al hacer click en un producto → modal de venta

#### 9.1.3 Modal de venta (2 botones)
1. **Efectivo** (💵) — registra venta como cash
2. **Tarjeta** (💳) — registra venta como card

#### 9.1.4 Panel de comandas (lateral derecho)
- **Lista de comandas pendientes** (no entregadas)
- Cada comanda muestra:
  - Prioridad (#1, #2, #3...)
  - Nombre del producto
  - Precio
  - Método de pago (icono 💵/💳)
  - Botones:
    - ⬆ Mover prioridad arriba
    - ⬇ Mover prioridad abajo
    - ✅ Marcar como entregado → desaparece de pendientes
    - ❌ Eliminar comanda
- **Reordenación automática**: al marcar como entregado, las prioridades se recalculan (1→2→3...)
- **Totales** al final:
  - Total vendido (suma todo lo entregado)
  - Total efectivo
  - Total tarjeta

#### 9.1.5 Icono de protocolo
- Botón con icono `ScrollText` → muestra modal con pasos del protocolo del producto seleccionado

### 9.2 APIs del POS
| Método | Ruta | Función |
|--------|------|---------|
| POST | `/api/sales` | Crear venta (body: employeeId, items[], paymentMethod, total) |
| GET | `/api/sales?date=YYYY-MM-DD` | Ventas del día (con items) |
| PUT | `/api/sale-items/[id]` | Actualizar item (entregar: status=DELIVERED) |
| DELETE | `/api/sale-items/[id]` | Eliminar item |

---

## 📅 10. CALENDARIO DE TURNOS — `/turno/calendario`

### 10.1 Vistas
Tres modos de visualización conmutables:
1. **Día** — Vista detallada de un día concreto
2. **Semana** — Vista semanal (de domingo a sábado)
3. **Mes** — Vista mensual con cuadrícula de días

### 10.2 Navegación
- Flechas ← → para navegar entre períodos
- Botón "Hoy" para volver al día actual

### 10.3 Funcionalidad
- Muestra SOLO los turnos asignados al empleado logueado
- Cada día con turno muestra: nombre del turno, horario, rol
- En vista día/semana: líneas de tiempo con horas

### 10.4 Intercambio de turnos (SWAPS)
- Al hacer click en un turno asignado → modal de intercambio
- **Dos tipos de intercambio**:
  1. **Intercambio (swap)**: cambiar turno con otro empleado
  2. **Sustitución (substitute)**: ceder el turno a otro empleado
- Selector de compañero (dropdown con lista de usuarios activos)
- Se registra en `ShiftSwap` con: usuario original, usuario reemplazo, tipo, asignación, fecha

### 10.5 APIs de intercambios
| Método | Ruta | Función |
|--------|------|---------|
| POST | `/api/shift-swaps` | Crear intercambio |
| DELETE | `/api/shift-swaps/[id]` | Eliminar intercambio |
| DELETE | `/api/shift-assignments/[id]` | Eliminar asignación |

---

## 📈 11. DASHBOARD EMPLEADO — `/turno/dashboard`

### 11.1 KPIs personales
1. **Total vendido** (💰 verde) — suma total de ventas del empleado
2. **Productos vendidos** (🛒 azul) — cantidad de items
3. **Efectivo** (💵 verde) — total en efectivo + barra de progreso
4. **Tarjeta** (💳 morado) — total en tarjeta + barra de progreso

### 11.2 Historial de turnos
- Tabla expandible con: fecha, turno, horario, rol, ventas, total
- Click para expandir y ver detalle del turno

### 11.3 Ventas por hora
- Desglose por hora: total, efectivo, tarjeta, número de transacciones
- Expansión para ver productos vendidos en cada hora
- Totales consolidados

### 11.4 Exportación
- Botón "Exportar mis ventas" → CSV

### 11.5 APIs
| Ruta | Función |
|------|---------|
| `/api/dashboard/my-stats` | Estadísticas del empleado logueado |
| `/api/dashboard/hourly-sales` | Ventas por hora |

---

## 📦 12. MODELO DE DATOS (Prisma/SQLite)

### 12.1 Modelos

```
User                  ← Persona (admin o empleado)
├── id, name, email, password, role, isActive
├── customFields (JSON string)
├── assignedShifts → ShiftAssignment[]
├── saleTransactions → SaleTransaction[]
├── originalSwaps → ShiftSwap[]
├── replacementSwaps → ShiftSwap[]
└── shiftDebts → ShiftDebt[]

Product               ← Producto de la cantina
├── id, name, price, tags (JSON string), imageUrl, description, isActive
├── customFields (JSON string)
├── protocol → Protocol? (opcional, 1:1)
├── inventory → Inventory? (opcional, 1:1)
├── saleItems → SaleItem[]
└── recipes → ProductRecipe[]

Inventory             ← Stock de cada producto
├── product → Product (1:1)
├── stock, minStock, unit
└── customFields (JSON string)

Shift                 ← Turno (mañana/tarde/noche)
├── id, name, startTime, endTime
├── daysOfWeek (string "0,1,2,3,4,5,6")
├── openingProtocol (JSON string de pasos)
├── closingProtocol (JSON string de pasos)
└── assignments → ShiftAssignment[]

ShiftAssignment       ← Asignación de empleado a turno en fecha concreta
├── shift → Shift
├── user → User
├── date, role
└── swaps → ShiftSwap[]
   Límite: máximo 2 personas por shiftId+date

ShiftSwap             ← Intercambio de turno entre empleados
├── originalUser → User
├── replacementUser → User
├── shiftAssignment → ShiftAssignment
└── type ("swap" | "substitute")

ShiftDebt             ← Deuda de empleado
├── user → User
├── reason, isPaid
└── createdAt

SaleTransaction       ← Venta / transacción
├── turnoId (int)
├── employee → User? (opcional)
├── total, paymentMethod ("cash" | "card")
└── items → SaleItem[]

SaleItem              ← Item dentro de una venta
├── sale → SaleTransaction
├── product → Product
├── productName, price, quantity
├── priority (orden en cola)
├── status ("PENDING" | "DELIVERED")
└── createdAt

RawMaterial           ← Materia prima (legacy, para recetas)
├── id, name, unit, stock, minStock
└── recipes → ProductRecipe[]

ProductRecipe          ← Relación producto → materia prima (cantidad)
├── product → Product
├── rawMaterial → RawMaterial
└── quantity
   Unique: (productId, rawMaterialId)

Protocol              ← Protocolo (apertura/cierre/cocina/producto)
├── type ("APERTURA" | "CIERRE" | "COCINA" | "PRODUCTO")
├── name, description
├── steps (JSON string array)
├── product → Product? (opcional, 1:1 si tipo PRODUCTO)
└── completions → ProtocolCompletion[]

ProtocolCompletion    ← Registro de completado de protocolo
├── protocol → Protocol
├── date, completedBy, completed
└── createdAt
```

---

## 🧩 13. COMPONENTES Y FUNCIONES COMPARTIDAS

### 13.1 `src/app/decorative-elements.tsx`
- Elementos decorativos fijos en la app:
  - Noise texture overlay (textura de ruido, opacidad 0.4, mix-blend-mode overlay)
  - Blob decorativo 1 (esquina inferior derecha)
  - Blob decorativo 2 (esquina superior izquierda)
  - Cursor follower (punto verde salvia que sigue al ratón)

### 13.2 `src/app/globals.css`
- Variables CSS: `--sage`, `--sage-light`, `--dark`, `--grey`, `--light-grey`, `--white`
- Clases utilitarias: `.btn-sage`, `.card-wellness`, `.reveal` (fade-up animation)
- Animaciones: hover cards (translateY), hover buttons (circle pseudo-element)
- Estilos de inputs, selects, textareas

### 13.3 `src/components/ThemeToggle.tsx`
- Botón de cambio claro/oscuro (luna/sol)
- Aplica clase `dark` al `<html>` y persiste en localStorage

### 13.4 `src/lib/export-csv.ts`
- Función `downloadCsv(data, filename)` — descarga CSV desde array de objetos

### 13.5 `src/lib/auth.ts`
- `createToken(payload)` — crea JWT
- `verifyToken(token)` — verifica JWT
- Funciones auxiliares de autenticación

---

## 🔁 14. FLUJOS COMPLETOS

### 14.1 Flujo de venta (POS)
1. Empleado loguea → /login → hub-empleado → Mi Turno
2. Ve bienvenida con turno asignado (o sin él)
3. Filtra productos por tag o busca por nombre
4. Click en producto → modal con 2 opciones: Efectivo o Tarjeta
5. Selecciona método → POST `/api/sales` → comanda aparece en panel lateral
6. La comanda aparece con prioridad autoasignada
7. Cuando prepara el producto → click ✅ → se marca como DELIVERED
8. Prioridades se recalculan automáticamente
9. Puede reordenar prioridades con ↑ ↓

### 14.2 Flujo de asignación de turnos (admin)
1. Admin va a Personal → pestaña Empleados → "Asignar turnos"
2. Ve calendario mensual con colores: verde (disponible), amarillo (1/2), rojo (lleno)
3. Click en un día → selecciona turno y rol → guarda
4. Batch save → POST `/api/shift-assignments/batch`
5. Validación: máximo 2 personas por turno+fecha

### 14.3 Flujo de intercambio de turno (empleado)
1. Empleado va a Calendario → ve sus turnos asignados
2. Click en un turno → modal de intercambio
3. Selecciona tipo: swap (intercambio) o substitute (cesión)
4. Selecciona compañero → POST `/api/shift-swaps`
5. Se crea el intercambio en BD

### 14.4 Flujo de dashboard (admin)
1. Admin selecciona rango de fechas
2. API devuelve stats: ventas, top productos, top empleados, ventas por hora, etc.
3. Se renderizan KPIs, tablas, barras de progreso
4. Puede exportar CSV

---

## 🎨 15. DISEÑO VISUAL (Wellness / ClearPath)

### 15.1 Paleta de colores
| Variable | Hex | Uso |
|----------|-----|-----|
| `--sage` | `#7FA69B` | Acento principal, botones, highlights |
| `--sage-light` | `rgba(127,166,155,0.08)` | Fondos sutiles |
| `--dark` | `#2E3231` | Texto principal, headings |
| `--grey` | `#535956` | Texto cuerpo |
| `--light-grey` | `#949E9B` | Texto secundario, labels |
| `--white` | `#FFFFFF` | Fondo de página |

### 15.2 Tipografía
- Headings: Inter, weight 500, letter-spacing -0.03em
- Subheadings: Crimson Text, serif, weight 400
- Body: Inter, weight 400, 14px, line-height 1.8
- Precios: Inter, weight 500, letter-spacing -0.04em, color sage
- Botones: Inter, weight 600

### 15.3 Estilo de componentes
- **Cards**: border-radius 16px, box-shadow sutil, hover translateY(-2px)
- **Botones primarios**: pill-shape (border-radius 999px), fondo sage, hover animation con círculo
- **Inputs**: border 1px rgba(0,0,0,0.06), focus: border-color sage + box-shadow sage-light
- **Tabs tipo bookmark**: pestañas solapadas estilo Chrome, activa más alta

---

## 🛠️ 16. COMANDOS DE DESARROLLO

```bash
npm run dev          # Servidor dev (por defecto puerto 3000)
npm run build        # Build de producción
npm run start        # Servidor producción
npx prisma studio    # UI de BD (SQLite)
npx prisma generate  # Regenerar Prisma Client
npx prisma migrate dev --name <nombre>  # Migración
```

---

## ⚠️ 17. NOTAS IMPORTANTES

### 17.1 Dependencias entre funcionalidades
- **Las materias primas (`RawMaterial`) existen como modelo legacy**. El prompt V3 planeaba fusionarlas con productos, pero el código actual aún las mantiene separadas con `ProductRecipe` como puente.
- **La autenticación está hardcodeada** — userId 1 = ADMIN, userId 2 = EMPLOYEE. No hay creación de múltiples admins desde la UI.
- **No hay middleware de ruta** — cualquier página es accesible sin login si se conoce la URL. La cookie token no se valida en todas las páginas.

### 17.2 Funcionalidades pendientes/legacy
- `/admin/materias-primas` → existe pero el hub-admin ya la oculta
- El modelo `RawMaterial` y `ProductRecipe` deberían migrarse a un sistema de ingredientes basado en JSON
- `ShiftDebt` se usa pero no tiene UI de creación para admin (solo se ve en dashboard)
- `ProtocolCompletion` existe en BD pero no tiene UI completa de gestión

### 17.3 Convenciones de estilo
- Archivos de páginas usan `"use client"` (Next.js Client Components)
- Layouts también son client components
- Las API routes no llevan `"use client"`
- Colores: usar siempre las variables CSS definidas en globals.css
- Responsive: Tailwind breakpoints sm/md/lg/xl

---

*Fin del documento Base 44 — Documentación completa de La Cafeta*
