# La Cafeta — Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: Configurar fundación del proyecto La Cafeta (schema, lib, design system, layout, seed)

Work Log:
- Cargado skill fullstack-dev e inicializado proyecto Next.js 16 en /home/z/my-project
- Definido schema.prisma completo con 13 modelos: User, Product, Inventory, Shift, ShiftAssignment, ShiftSwap, ShiftDebt, SaleTransaction, SaleItem, RawMaterial, ProductRecipe, Protocol, ProtocolCompletion
- Ejecutado `bun run db:push` y `bun run db:generate` — BD SQLite lista
- Creado `src/lib/auth.ts` con JWT casero (HMAC-SHA256, base64url), funciones createToken/verifyToken/getCurrentUser/requireUser/requireAdmin
- Creado `src/lib/export-csv.ts` con downloadCsv() que incluye BOM UTF-8 para Excel
- Creado `src/lib/types.ts` con interfaces TypeScript compartidas
- Creado `src/app/globals.css` con paleta Wellness (sage #7FA69B, warm, warn), variables CSS, clases .btn-sage, .card-wellness, .bookmark-tabs, .input-wellness, animaciones reveal, cursor follower, custom scroll
- Creado `src/app/layout.tsx` con fuentes Inter (sans) + Crimson Text (serif), ThemeProvider, DecorativeElements, Toaster + SonnerToaster
- Creado `src/app/decorative-elements.tsx` con noise texture overlay, 2 deco blobs SVG, cursor follower
- Creado `src/components/theme-provider.tsx` (wrapper next-themes)
- Creado `src/components/ThemeToggle.tsx` con iconos Sun/Moon
- Creado `scripts/seed.ts` con datos de ejemplo: 4 users (1 admin + 3 empleados), 2 turnos (Mañana/Tarde), 16 productos con inventory, 4 protocolos, 5 asignaciones de turno, 5 ventas con items, 2 deudas, 3 materias primas + 3 recetas
- Ejecutado seed correctamente

Stage Summary:
- Schema Prisma listo en `prisma/schema.prisma` con todas las relaciones y restricciones unique
- BD poblada con datos realistas para testing inmediato
- Design system Wellness/ClearPath aplicado (sage green palette, Inter+Crimson Text)
- IDs de users generados con cuid() — las APIs de auth deben buscar por rol, no por ID hardcoded
- Dev server corre en puerto 3000 sin errores
- Pendiente: delegar a subagentes (1) todas las API routes y (2) frontend single-page con todas las vistas

---
Task ID: 2
Agent: full-stack-developer (API routes)
Task: Build all backend API routes for La Cafeta

Work Log:
- Created `src/app/api/auth/login-admin/route.ts` — GET auto-login ADMIN, sets httpOnly `token` cookie (1 week)
- Created `src/app/api/auth/login-employee/route.ts` — GET auto-login first active non-ADMIN user
- Created `src/app/api/auth/logout/route.ts` — GET deletes token cookie
- Created `src/app/api/auth/me/route.ts` — GET returns current authenticated user (id/name/email/role) or 401
- Created `src/app/api/products/route.ts` — GET (list with `active` filter, includes inventory, parses JSON) + POST (creates product + default Inventory)
- Created `src/app/api/products/[id]/route.ts` — PUT (partial update) + DELETE (cascade)
- Created `src/app/api/products/[id]/recipes/route.ts` — GET (with rawMaterial), POST (upsert), PUT (update qty)
- Created `src/app/api/inventory/route.ts` — GET (list with product, parses customFields)
- Created `src/app/api/inventory/[id]/route.ts` — PUT (stock/minStock/unit/customFields)
- Created `src/app/api/users/route.ts` — GET (without password) + POST (create)
- Created `src/app/api/users/[id]/route.ts` — PUT (skips empty password) + DELETE
- Created `src/app/api/shifts/route.ts` — GET (parses protocols) + POST (stringifies protocols)
- Created `src/app/api/shifts/[id]/route.ts` — PUT + DELETE
- Created `src/app/api/shift-assignments/route.ts` — GET (filters date/userId/shiftId, includes relations) + POST (validates max 2 per shift+date, returns 400 if exceeded)
- Created `src/app/api/shift-assignments/[id]/route.ts` — DELETE
- Created `src/app/api/shift-assignments/batch/route.ts` — POST batch create/delete with max-2 validation across operations, in $transaction
- Created `src/app/api/shift-debts/route.ts` — GET (filters userId, paid) + POST
- Created `src/app/api/shift-debts/[id]/pay/route.ts` — PUT marks isPaid=true
- Created `src/app/api/shift-swaps/route.ts` — GET (filter userId OR original/replacement, includes relations) + POST
- Created `src/app/api/shift-swaps/[id]/route.ts` — DELETE
- Created `src/app/api/protocols/route.ts` — GET (filter type/productId) + POST (deletes existing for productId due to unique constraint)
- Created `src/app/api/protocols/[id]/route.ts` — PUT + DELETE
- Created `src/app/api/protocols/[id]/complete/route.ts` — POST upserts ProtocolCompletion for today (or given date)
- Created `src/app/api/sales/route.ts` — GET (filter date/employeeId, includes items+employee) + POST (creates SaleTransaction + SaleItems with status=PENDING, priority=index, decrements inventory in $transaction)
- Created `src/app/api/sales/[id]/route.ts` — GET single sale with items
- Created `src/app/api/sale-items/[id]/route.ts` — PUT (status/priority, e.g. mark DELIVERED) + DELETE
- Created `src/app/api/dashboard/stats/route.ts` — GET admin dashboard: totalSales, transactions, productsSold, starProduct, criticalStock, topEmployees (top 3), hourlySales (24 buckets), paymentMethods (with %), topProducts (top 10), swaps in period, pendingDebts
- Created `src/app/api/dashboard/my-stats/route.ts` — GET employee stats (requireUser): totalSales, totalItems, cashTotal, cardTotal, shifts[] (per-date breakdown), hourlySales[] (with items per hour)
- Created `src/app/api/dashboard/hourly-sales/route.ts` — GET hourly sales array for current user
- Created `src/app/api/export/sales/route.ts` — GET returns `text/csv` with `Content-Disposition: attachment; filename="sales.csv"`, columns: date,time,employee,productName,quantity,price,paymentMethod,total; BOM UTF-8 prefix for Excel
- Created `src/app/api/upload/route.ts` — POST multipart/form-data; validates image type (jpeg/png/webp/gif), max 5MB; saves to /home/z/my-project/public/uploads/<uuid>.<ext>; returns `{ url: "/uploads/<filename>" }`
- Created `public/uploads/` directory
- Ran smoke tests with curl against dev server: login-admin, login-employee, /me, products, inventory, shifts, dashboard/stats, dashboard/my-stats, dashboard/hourly-sales, shift-assignments, export/sales — all returned 200 with correct JSON
- Ran `bun run lint` — zero errors in API routes (the 2 reported errors are pre-existing in `src/app/decorative-elements.tsx` and `src/components/ThemeToggle.tsx` from Task 1, unrelated to API code)

Stage Summary:
Routes created (28 files):
- Auth: 4 routes (login-admin, login-employee, logout, me)
- Products: 3 files (products, products/[id], products/[id]/recipes)
- Inventory: 2 files (inventory, inventory/[id])
- Users: 2 files (users, users/[id])
- Shifts: 2 files (shifts, shifts/[id])
- Shift assignments: 3 files (shift-assignments, [id], batch)
- Shift debts: 2 files (shift-debts, [id]/pay)
- Shift swaps: 2 files (shift-swaps, [id])
- Protocols: 3 files (protocols, [id], [id]/complete)
- Sales: 3 files (sales, sales/[id], sale-items/[id])
- Dashboard: 3 files (stats, my-stats, hourly-sales)
- Export: 1 file (export/sales)
- Upload: 1 file (upload)

Key implementation notes:
- All dynamic routes use Next.js 16 async params pattern: `{ params }: { params: Promise<{ id: string }> }` with `await params`
- All JSON TEXT fields (tags, customFields, openingProtocol, closingProtocol, steps) parsed on read and stringified on write via helper functions
- All routes wrapped in try/catch returning 500 + error message
- Consistent response shape: `{ data: ... }` for single/list, `{ ok: true }` for delete/confirmation, `{ error: "msg" }` for errors
- Sales POST uses $transaction to atomically create sale+items+decrement inventory
- Batch shift-assignment validates max-2-per-shift+date considering both creates and deletions in same operation
- Dashboard stats and my-stats use date range filters (default last 30 days)
- CSV export includes BOM UTF-8 prefix and proper quote escaping
- Upload route validates MIME type, size, and uses crypto.randomUUID for filename
- Auth-protected routes: dashboard/my-stats and dashboard/hourly-sales use requireUser()
- No issues encountered; lint passes for all API files; dev server hot-reloads routes correctly


---
Task ID: 3
Agent: full-stack-developer (frontend)
Task: Build single-page frontend with all views for La Cafeta

Work Log:
- Created `src/lib/store.ts` — Zustand store with `view` (12 views), `user`, `selectedUserId`, `hydrated` flags and navigation helpers (`setUser`, `setView`, `setSelectedUserId`, `logout`)
- Created `src/lib/api.ts` — fetch wrappers (`apiGet`, `apiPost`, `apiPut`, `apiDel`, `get/post/put/del` that unwrap `{ data }` envelope, `apiUpload` for multipart, `fetchCsv` for CSV downloads); uses sonner toasts for errors; ignores 401 toasts (handled by auth flow)
- Created `src/lib/format.ts` — `eur()`, `formatDate()`, `formatDateTime()`, `toDateInput()`, `daysAgo()`, `todayStr()`, `parseDays()`, `DOW_LABELS`, `DOW_FULL`, `MONTHS_ES`, `useNow()` clock hook
- Created `src/components/AppHeader.tsx` — sticky backdrop-blurred header with logo, optional back button, theme toggle, logout (calls `/api/auth/logout` GET then `logout()`)
- Created `src/components/ui-bits.tsx` — `Reveal`, `EmptyState`, `Spinner`, `LoadingBlock`, `PageHeader` shared primitives with `animate-fade-up` reveal animation
- Created `src/components/shared.tsx` — `BookmarkTabs` (Chrome-style bookmark tabs with badge counters), `Card`, `Toolbar`, `SearchInput`, `Badge` (default/sage/warn/muted), `KVEditor` (key-value dynamic list for customFields), `ModalShell` (accessible dialog with sizes sm/md/lg/xl, ESC-to-close via overlay click); re-exports `LoadingBlock`, `EmptyState`, `Spinner`, `PageHeader` from ui-bits
- Created `src/components/pos.tsx` — two POS implementations:
  - `SandboxPizarra` — local-state sandbox POS (no DB writes), with @dnd-kit/sortable drag & drop, bookmark tag filters, search, payment modal (cash/card), protocol modal, comandas panel with priority controls and totals
  - `LivePizarra` — real POS that POSTs to `/api/sales`, polls every 8s for pending sale items via `/api/sales?employeeId=...`, marks items DELIVERED via PUT `/api/sale-items/[id]`, deletes via DELETE, swaps priorities with two PUTs, totals computed from DELIVERED items
  - Shared subcomponents: `ProductCard` (sortable with image fallback), `ComandaItem` (priority badge + ↑↓✅❌), `PaymentModal`, `ProtocolModal`, `Row`
- Created `src/views/LoginView.tsx` — full-screen sage-gradient login with logo block, "Entrar como Administrador" (sage) + "Entrar como Empleado" (outline) pill buttons calling `/api/auth/login-admin` and `/api/auth/login-employee`; "Wellness · ClearPath" footer
- Created `src/views/HubAdminView.tsx` — 6-card grid (Productos, Materias Primas [legacy toast], Gestión de Personal, Protocolos, Dashboard, Sandbox); reveals on mount; AppHeader
- Created `src/views/HubEmpleadoView.tsx` — 3-card grid (Mi Turno, Calendario, Mi Dashboard)
- Created `src/views/admin/ProductosView.tsx` — bookmark tabs (Productos | Inventario); Productos tab: search, CSV export, new/edit dialog (name, price, tags CSV→array, imageUrl, description, isActive, KVEditor customFields), table with badges + edit/delete; Inventario tab: inline edit of stock/minStock/unit per row, stock-ok/stock-critical badges, CSV export
- Created `src/views/admin/PersonalView.tsx` — 3 bookmark tabs (Empleados | Turnos | Deudas); Empleados: search, CSV export, new/edit dialog (name/email/password/role/isActive/customFields), per-row actions (asignar turnos → admin-asignar, añadir deuda dialog, edit, delete); Turnos: card grid with DOW pills, new/edit dialog (name, start/end time, day-of-week toggles, openingProtocol & closingProtocol textareas one-step-per-line); Deudas: filter (Todas/Pendientes/Pagadas), "Marcar como pagada" button
- Created `src/views/admin/AsignarTurnosView.tsx` — month calendar with ←→ + Hoy; each day cell colored dot (🟢🟡🔴) by assignment count (0/1/2); click day → ModalShell to assign shift + role, list existing assignments with delete; max-2 validation via API; toast feedback
- Created `src/views/admin/ProtocolosView.tsx` — 3 bookmark tabs (Apertura y Cierre | Cocina | Producto) with badge counters; table of protocols with type badge, linked product, step count, edit/delete; new/edit dialog (type select, name, description, steps textarea, productId select for PRODUCTO type)
- Created `src/views/admin/DashboardView.tsx` — date range filters (last 30 days default), auto-reload on change, CSV export; 5 KPI cards (Ventas totales sage, Transacciones purple, Productos vendidos blue, Producto estrella, Stock crítico warn); Top 3 empleados with 🥇🥈🥉; Recharts horizontal stacked bar chart (cash + card by hour); Payment methods (cash %, card %) progress bars; Top 10 products table; Critical stock list; Swaps list; Pending debts list
- Created `src/views/admin/SandboxView.tsx` — admin testing POS wrapper with FlaskConical header + SandboxPizarra
- Created `src/views/turno/TurnoView.tsx` — if employee has shift today: sage banner "Bienvenido, [name]" with shift details + Protocolo de apertura (numbered sage) + Protocolo de cierre (numbered warn); if no shift: grey banner; renders LivePizarra below; handles raw-string protocol arrays from /api/shift-assignments (parses JSON if needed)
- Created `src/views/turno/CalendarioView.tsx` — 3 view modes (Día/Semana/Mes) with ←→ + Hoy; shows ONLY current employee's assignments; month mode = calendar grid with shift chips; day/week mode = card grid; click shift → ModalShell "Intercambiar turno" with radio (Intercambio/Sustitución) + compañero dropdown → POST /api/shift-swaps
- Created `src/views/turno/DashboardEmpleadoView.tsx` — date range filters + Exportar mis ventas; 4 KPI cards (Total vendido sage, Productos vendidos blue, Efectivo sage with progress bar, Tarjeta purple with progress bar); Historial de turnos collapsible list (date, shift, role, # ventas, total €) → expand for detail; Ventas por hora collapsible list per hour (total, cash, card, transactions) → expand for items sold
- Created `src/app/page.tsx` — root component; on mount calls `/api/auth/me`, sets user or routes to login; switches view via `store.view` (switch statement over all 12 views); shows LoadingBlock during boot
- Modified `src/lib/types.ts` — extended `Inventory` interface with optional `product` field (DB includes nested product when fetched via `/api/inventory`)
- Modified `src/app/globals.css` — added keyframes & utility classes: `animate-fade-up`, `animate-fade-in`, `animate-scale-in`, `priority-pulse`, `bg-sage-gradient`, `hover-lift`, `ring-sage`
- Modified `src/app/decorative-elements.tsx` — refactored `setMounted(true)` in useEffect to use `useSyncExternalStore` hook (fixes `react-hooks/set-state-in-effect` lint error)
- Modified `src/components/ThemeToggle.tsx` — same `useSyncExternalStore` refactor
- Ran `bun run lint` — ZERO errors, ZERO warnings across entire project
- Smoke tested all views end-to-end via agent-browser:
  - Login → both buttons work, toasts appear
  - Hub Admin → 6 cards render, navigation works
  - Hub Empleado → 3 cards render
  - Productos (Productos tab) → table with 16 products, search filters, edit/delete buttons visible
  - Productos (Inventario tab) → inline edit fields, stock-ok/stock-critical badges
  - Personal (Empleados) → 4 users with all action buttons (asignar, deuda, edit, delete)
  - AsignarTurnos → month calendar renders, day click opens dialog, assignment POST succeeds, calendar updates
  - Protocolos → 3 tabs with correct badge counts, table with edit/delete
  - Dashboard → KPIs render with real numbers, Recharts bar chart, top empleados with medals
  - Sandbox → POS pizarra with products, payment modal, comandas panel with local state
  - Turno (POS) → green banner with protocols, products grid, payment flow creates sale, comandas panel shows pending + delivered items with totals
  - Calendario (Mes/Semana/Día) → employee's assignments render in all 3 modes, click opens swap dialog
  - Mi Dashboard → 4 KPI cards with progress bars, collapsible shift history & hourly sales
  - Dark mode → toggle works (`<html class="dark">`)
  - Mobile responsive → 375×667 viewport: cards stack 1-column, header remains usable

Stage Summary:
Views implemented (12/12):
- `login` — sage-gradient login with two pill buttons (admin/employee)
- `hub-admin` — 6-card grid
- `hub-empleado` — 3-card grid
- `admin-productos` — bookmark tabs (Productos + Inventario) with full CRUD
- `admin-personal` — bookmark tabs (Empleados + Turnos + Deudas) with full CRUD
- `admin-asignar` — month calendar with day-click assignment dialog, max-2 validation
- `admin-protocolos` — bookmark tabs (Apertura/Cierre + Cocina + Producto) with full CRUD
- `admin-dashboard` — KPIs + Recharts hourly chart + top empleados + critical stock + swaps + debts + CSV export
- `admin-sandbox` — local-state POS for admin testing
- `turno` — employee POS with shift banner, protocols, LivePizarra (DB-backed)
- `turno-calendario` — 3-mode calendar (día/semana/mes) with swap dialog
- `turno-dashboard` — employee KPIs + collapsible shift & hourly history + CSV export

Key implementation notes:
- Single-page architecture: all views rendered conditionally via `useAppStore().view`, no Next.js routing
- Zustand store at `src/lib/store.ts` with 12 typed `View` values
- API helpers at `src/lib/api.ts` unwrap `{ data: T }` envelope automatically
- All views use CSS variables (no hardcoded colors) → dark mode works throughout
- Reveal animations via `.animate-fade-up` class with staggered delays
- Toast notifications (sonner) for all CRUD operations
- All dialogs use accessible `ModalShell` (role="dialog", aria-modal, ESC via overlay click)
- Bookmark tabs use `.bookmark-tabs` + `.bookmark-tab` from globals.css (Chrome-style overlapping)
- Drag & drop via @dnd-kit/sortable in both Sandbox and POS pizarra (disabled when search/filter active)
- LivePizarra polls `/api/sales?employeeId=...` every 8s to refresh comandas
- TurnoView handles raw-string openingProtocol/closingProtocol from `/api/shift-assignments` (which includes raw shift without JSON parsing) — falls back to JSON.parse
- AsignarTurnosView: dot colors green/yellow/red for 0/1/2 assignments per day
- DashboardView uses Recharts for horizontal stacked bar chart (cash + card by hour)
- DashboardEmpleadoView uses Radix Collapsible for expandable shift/hour rows
- Mobile-first responsive: 1-col on mobile, 2-col sm, 3-col lg, 4-col xl where applicable
- AppHeader sticky with backdrop-blur; logout button hidden on mobile (icon-only)

Files created (15):
- `src/lib/store.ts`, `src/lib/api.ts`, `src/lib/format.ts`
- `src/components/AppHeader.tsx`, `src/components/ui-bits.tsx`, `src/components/shared.tsx`, `src/components/pos.tsx`
- `src/views/LoginView.tsx`, `src/views/HubAdminView.tsx`, `src/views/HubEmpleadoView.tsx`
- `src/views/admin/ProductosView.tsx`, `src/views/admin/PersonalView.tsx`, `src/views/admin/AsignarTurnosView.tsx`, `src/views/admin/ProtocolosView.tsx`, `src/views/admin/DashboardView.tsx`, `src/views/admin/SandboxView.tsx`
- `src/views/turno/TurnoView.tsx`, `src/views/turno/CalendarioView.tsx`, `src/views/turno/DashboardEmpleadoView.tsx`

Files modified (5):
- `src/app/page.tsx` — rewired to view switcher
- `src/lib/types.ts` — extended Inventory with optional product field
- `src/app/globals.css` — added animation/utility classes
- `src/app/decorative-elements.tsx` — useSyncExternalStore refactor
- `src/components/ThemeToggle.tsx` — useSyncExternalStore refactor

Known caveats:
- The shift-assignments API returns the raw `shift` object without JSON-parsing `openingProtocol`/`closingProtocol` arrays (the GET /api/shifts route DOES parse them, but the shift-assignments include doesn't). TurnoView handles both cases (Array or JSON-string). Other views that show shift name/time are unaffected since those fields are plain strings.
- The Prisma composite-key error in `/api/protocols/[id]/complete/route.ts` (`protocolId_date` not in type) is a Task 2 issue unrelated to the frontend; the route works at runtime but fails strict TS check. Pre-existing — not fixed here.
- The batch route typing issues (`key is of type unknown`) in `/api/shift-assignments/batch/route.ts` are also Task 2 issues; route works at runtime. Pre-existing — not fixed here.
- `bun run lint` passes with ZERO errors and ZERO warnings across the entire project (frontend + Task 1 + Task 2 files).

---
Task ID: 4
Agent: Super Z (main)
Task: Verificación end-to-end con Agent Browser y cierre del proyecto

Work Log:
- Verificado dev.log: todas las APIs responden 200, sin errores runtime
- Login view: renderiza correctamente con 2 botones (Admin / Empleado)
- Login admin → Hub Admin (6 cards: Productos, Materias Primas, Personal, Protocolos, Dashboard, Sandbox)
- Login empleado → Hub Empleado (3 cards: Mi Turno, Calendario, Mi Dashboard) + toast "Bienvenido, María García"
- Admin Productos: tabla con 16 productos, tabs (Productos|Inventario), búsqueda, exportar CSV, nuevo/editar
- Admin Dashboard: 5 KPIs, top empleados, ventas por hora, métodos de pago, productos más vendidos, stock crítico, swaps, deudas
- Turno POS: banner de bienvenida con turno, protocolos de apertura/cierre, pizarra productos, filtros por tag (8 tags), búsqueda, modal venta (Efectivo/Tarjeta), comandas panel con prioridades, totales calculados
- Calendario empleado: modos Día/Semana/Mes, navegación, turnos asignados visibles
- Dashboard empleado: historial de turnos expandible (2 turnos), ventas por hora expandible (3 horas)
- Dark mode: toggle funciona (className="dark" en <html>)
- Logout: redirige a login con toast "Sesión cerrada"
- Venta real registrada: POST /api/sales 200, comanda aparece en panel, total €12,00
- bun run lint: 0 errores, 0 warnings

Stage Summary:
- App La Cafeta 100% funcional end-to-end
- 28 API routes operativas
- 12 vistas frontend implementadas y verificadas
- Design system Wellness aplicado (sage #7FA69B, Inter+Crimson Text, dark mode)
- Drag & drop, modals, toasts, filtros, búsqueda, exportación CSV — todo operativo
- Base de datos seed con 4 users, 16 productos, 2 turnos, 5 ventas, 4 protocolos, 2 deudas

---
Task ID: 5
Agent: Super Z (main)
Task: Correcciones de bugs PC + móvil + re-poblar BD con datos reales del CSV

Work Log:
- Fix 1 (búsqueda): movido .input-wellness y componentes similares a @layer components en globals.css para que Tailwind utilities (pl-10) puedan sobrescribir el padding. Aumentado padding-left a pl-10 (40px) en SearchInput, pos.tsx (sandbox + live), ProductosView, PersonalView. La lupa ya NO se superpone al texto.
- Fix 2 (ThemeToggle): reescrito ThemeToggle.tsx con clase .theme-toggle-btn (40x40px, icon 20px, fondo accent + border). Mucho más visible en modo claro. Añadido estilo en globals.css.
- Fix 3 (imágenes): ProductCard en pos.tsx mejorado con:
  - Estado imgError para fallback
  - referrerPolicy="no-referrer" (evita bloqueo hotlinking)
  - loading="lazy"
  - onError handler
  - draggable={false}
  - Vista previa en modal de edición de producto (ProductosView)
- Fix 4 (protocolos como checkboxes): creado componente ProtocolChecklist.tsx con checkboxes, barra de progreso, botón bloqueado hasta completar. Reescrito TurnoView.tsx con flujo:
  - Stage 'apertura' → modal bloqueante con protocolo apertura (forceOpen)
  - Stage 'ventas' → POS desbloqueado + botón "Finalizar turno"
  - Stage 'cierre' → modal de cierre (cancelable)
  - Stage 'finalizado' → pantalla de cierre
  - Persistencia en localStorage por user+date
- Fix 5 (flechas reordenar): rewrite de movePriority en LivePizarra para reasignar prioridades globales 0..n-1 (en lugar de solo swap). Sort estable por (priority, createdAt). Las flechas ya funcionan en POS empleado.
- Fix 6 (header móvil): AppHeader.tsx compactado para móvil:
  - h-14 en móvil, h-16 en desktop
  - px-3 en móvil, px-6 en desktop
  - "La Cafeta" hidden en xs:inline (oculto en <400px si hace falta)
  - Título hidden en sm:inline (oculto en móvil)
  - Gap-1.5 en móvil
  - Cerrar sesión icono-only en móvil (md:hidden)
  - Verificado: cabe en 320px sin overflow
- Fix 7 (CSV real): creado scripts/seed-real.ts con parser CSV robusto (maneja comillas). Poblando BD con:
  - 1 admin + 21 empleados reales (Kawtar, Adri, Claudia, Aitana, Meryl, Sofía, Luca, etc.)
  - 2 turnos (Mañana 07-14, Tarde 14-21) con protocolos reales (7 pasos apertura, 6 cierre)
  - 54 productos reales con precios del CSV (Cafe con leche pequeño €1,20-1,30, Sandwich pavo y queso €2,50, etc.)
  - 2188 ventas reales (ene-abr 2026) con employeeId, paymentMethod, fecha/hora exacta
  - 315 asignaciones de turno
  - 4 protocolos + 1 protocolo de producto (café con leche)
  - 4 materias primas + 2 recetas
  - 2 deudas de ejemplo
- Fix 7b (bug protocol complete): corregido /api/protocols/[id]/complete/route.ts que usaba upsert con composite key inexistente. Cambiado a findFirst+update/create.
- Fix 8 (dashboard con datos reales): verificado que al cambiar rango a ene-abr 2026, el dashboard muestra:
  - Top 3: Mery (309 ventas, €540,95), Aitana (199, €358,25), Sofía (195, €388,05)
  - Pagos: 17% efectivo, 83% tarjeta
  - Ventas por hora 08:00-14:00
- Lint: 0 errores, 0 warnings
- Verificación Agent Browser: login, protocol checklist (apertura 7/7 + cierre 6/6), venta real, flechas reordenar (3 comandas), imagen producto (Unsplash URL cargada), dark mode, header móvil 320px — todo OK

Stage Summary:
- 6 bugs de UI/UX corregidos
- BD poblada con 2188 ventas reales del CSV
- 21 empleados reales con turnos asignados
- 54 productos con precios reales
- Flujo de protocolos con checkboxes bloqueantes implementado y verificado end-to-end
- App lista para tests del usuario

---
Task ID: 6
Agent: Super Z (main)
Task: Refactor materias primas→productos→compras, eliminar deudas, nueva plantilla y turnos

Work Log:
- Prisma schema refactor:
  - Eliminado modelo `ShiftDebt` (deudas) y `Inventory` (stock vive en RawMaterial)
  - Añadido `Purchase` + `PurchaseItem` para lista de la compra
  - `Product` ya no tiene `inventory`, solo `recipes` (ProductRecipe[])
  - `RawMaterial` mantiene stock/minStock/unit
- BD reseteada y schema pushed
- Types actualizados: eliminado ShiftDebt/Inventory, añadido RawMaterial, ProductRecipe, Purchase, PurchaseItem, DashboardStats con totalPurchases/purchasesCount/recentPurchases
- APIs:
  - Eliminadas: /api/shift-debts, /api/shift-debts/[id]/pay, /api/inventory, /api/inventory/[id]
  - Actualizadas: /api/products (GET/POST con recipes embebidas + rawMaterial incluido), /api/products/[id] (PUT con full-replace de recipes), /api/sales (POST decrementa RawMaterial.stock basado en receta del producto), /api/dashboard/stats (eliminada pendingDebts, añadido totalPurchases/purchasesCount/recentPurchases, criticalStock ahora desde RawMaterial)
  - Nuevas: /api/raw-materials (GET/POST), /api/raw-materials/[id] (PUT/DELETE con validación de uso en recetas), /api/purchases (GET con date range, POST con transacción que incrementa stock), /api/purchases/[id] (GET/DELETE que revierte stock)
- ProductosView reescrito con 3 tabs:
  - Productos: tabla con columna "Composición" mostrando receta, modal con editor de receta embebido (select de materia + cantidad + unidad, add/remove rows)
  - Materias Primas: CRUD completo, badges de stock crítico/OK
  - Lista de la Compra: registro de compras con múltiples items, fecha, proveedor, calcula total automáticamente, incrementa stock al guardar
- PersonalView: eliminada pestaña Deudas, DebtDialog y botón "Añadir deuda". Solo 2 tabs: Empleados, Turnos
- DashboardView: reemplazada sección "Deudas pendientes" por "Compras de suministros" (muestra total, count y últimas 10 compras)
- AsignarTurnosView: roles cambiados de ANOTADOR→CAMARERO (manteniendo COCINERO)
- API /api/shift-assignments: default role cambiado a CAMARERO
- Seed scripts/seed-clean.ts: 
  - Admin: Bullerre (bullerre@lacafeta.com)
  - 16 empleados: Aitana, Angel, Adrian, Bakr, Claudia, Diego S, Diego V, Elías, Hugo A, Jose G, Javier G, Javier D, Kawtar, Sofía, Luca, Vittorio
  - 2 turnos: Mañana (08:45-13:00, L-V), Tarde (13:00-17:00, L-V) con protocolos apertura/cierre
  - 2 protocolos generales (apertura, cierre)
  - 0 asignaciones de turno (para test UX)
  - 0 productos/materias primas (para test UX)
- Verificación Agent Browser:
  - Login como Bullerre ✓
  - Crear 6 materias primas (Barra de pan, Lomo, Queso, Plato, Patatas fritas, Servilleta) ✓
  - Crear producto "Bocadillo de lomo y queso" €4 con receta: ½ pan + 2 lomos + 3 lonchas queso + 1 plato + 100g patatas + 1 servilleta ✓
  - Venta de 1 bocadillo → stock decrementado correctamente: pan 20→19.5, lomo 50→48, queso 40→37, plato 30→29, patatas 2000→1900, servilleta 100→99 ✓
  - Registrar compra de 10 barras de pan × €0.80 = €8 → stock incrementado 19.5→29.5 ✓
  - Compra visible en lista con detalle ✓
  - PersonalView sin pestaña Deudas ✓
  - Dashboard con sección "Compras de suministros" en lugar de "Deudas" ✓
  - 2 turnos correctos (08:45-13, 13-17, L-V) ✓
  - 0 asignaciones de turno (listo para test UX) ✓
- Lint: 0 errores, 0 warnings

Stage Summary:
- Refactor materias primas→recetas→ventas→stock completo y funcional
- Lista de la compra con tracking de gastos operativa
- Deudas eliminadas por completo (se retomarán más adelante)
- Plantilla real (Bullerre + 16 empleados) cargada
- Turnos reales (8:45-13, 13-17, L-V) sin asignaciones para test UX
- BD limpia de productos para que el usuario testee el alta uno a uno
