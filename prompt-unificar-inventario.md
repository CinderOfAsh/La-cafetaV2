# Refactor: Merge Raw Materials into Unified Inventory System

## Goal
Remove the standalone "Materias Primas" (Raw Materials) section and unify everything into a single "Inventory" system. Every stockable item (ingredients, materials, products) lives in one Inventory table. Products can reference multiple Inventory items with quantities, and selling a product automatically deducts stock from those linked inventory items.

## Changes Required

### 1. Data Model (schema.prisma)
- **Remove** `RawMaterial` and `ProductRecipe` tables entirely
- Make `Inventory` **independent** from the 1:1 Product relation — make `productId` optional (nullable)
- Add a new `ProductIngredient` junction table:
  ```prisma
  model ProductIngredient {
    id          Int       @id @default(autoincrement())
    productId   Int
    product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
    inventoryId Int
    inventory   Inventory @relation(fields: [inventoryId], references: [id])
    quantity    Float     @default(1)
    unit        String    @default("unidad")

    @@unique([productId, inventoryId])
  }
  ```
- Update the `Product` model to include `ingredients ProductIngredient[]`
- Update the `Inventory` model: make `productId` optional, remove the `@unique` constraint if it exists
- Run `prisma generate` after schema changes
- Run `prisma db push` to apply to SQLite

### 2. Data Migration
- Migrate all existing `RawMaterial` records into the `Inventory` table (creating inventory items with their current stock, minStock, and unit, with no productId)
- Migrate all existing `ProductRecipe` records into `ProductIngredient` (using the new Inventory IDs)
- Log any migration issues — don't lose existing data
- Update `src/lib/seed-data.json` to work with the new schema

### 3. UI: Remove Raw Materials Section
- From `hub-admin/page.tsx`, remove the "Materias Primas" card (it had icon `Wheat`)
- Delete the file `admin/materias-primas/page.tsx` entirely
- Remove any navigation links pointing to it from layouts or other files

### 4. UI: Unified Inventory Tab
- In `admin/productos/page.tsx`, the "Inventario" tab should now show ALL items with stock (both product-linked inventory AND standalone ingredients/materials)
- Add a "Nuevo material" button to create standalone inventory items (without a product)
- Show columns: Name, Stock, Min Stock, Unit, Linked Product (if any), Actions
- Allow inline stock editing (click stock value → edit → save) or a quick modal
- Keep the low-stock alert badge on the tab

### 5. UI: Product Ingredients Section
- In the product create/edit form (`admin/productos/page.tsx`), add an "Ingredientes / Materiales" section:
  - Searchable dropdown/picker to select inventory items
  - For each selected item: quantity field + unit field
  - Add/remove ingredients
  - Show total ingredient count and estimated cost (if prices are available, optional)
- If no inventory items exist yet, show: "No materials yet. Create some from the Inventory tab first."
- When viewing a product, display its ingredients in the table row

### 6. API Updates
- Update `/api/inventory` routes:
  - `GET`: return all inventory items, optionally filter by product association
  - `POST`: accept items without a productId (standalone materials)
  - `PUT /api/inventory/[id]`: update stock, minStock, unit
  - `DELETE /api/inventory/[id]`: remove inventory item (only if not used by any product)
- Update `/api/products/[id]/recipes` (or create `/api/products/[id]/ingredients`):
  - `GET`: return linked ingredients with full inventory data
  - `PUT/POST`: set ingredients for a product (replace all)
  - `DELETE`: remove all ingredients
- Update `POST /api/products` to accept an `ingredients` array and create `ProductIngredient` records
- Update `GET /api/products` and `GET /api/products/[id]` to include ingredients with inventory data

### 7. POS: Stock Deduction Logic
- In `/api/sales/route.ts` (`POST`), change the deduction logic:
  1. Check if the product has `ProductIngredient[]` entries
  2. If YES: deduct from each linked inventory item by the required quantity × sale quantity
  3. If NO: deduct from the product's own inventory record (where `productId` matches)
  4. Never let stock go below 0
  5. If stock is insufficient, still proceed with the sale but log a warning (don't block the sale)

### 8. Seed Data
- Update `src/lib/seed-data.json` with the new schema:
  - Inventory items for ingredients: pan de molde, mortadela, queso, leche, café, azúcar, aceite, tomate, mermelada, mantequilla, jamón, lomo, tortilla, etc.
  - Assign ingredients to composite products (e.g., bocadillos → pan + filling)
  - Keep simple products as standalone inventory items
- Make sure the seed endpoint (`/api/seed`) works with the new schema

### 9. Existing Data Cleanup
- Remove any references to `RawMaterial` or `ProductRecipe` in API routes, components, and lib files
- Update `src/lib/auth.ts` and `src/lib/prisma.ts` if they reference old models
- Check all `@/lib/seed-data.ts` references and update accordingly
- Update `src/app/api/export/*` routes if they reference old models

## Design & UX
- Keep the same visual style: sage colors, card-wellness, btn-sage, toast confirmations
- The inventory table should be full-width with clear column headers
- Ingredient chips/badges should appear in the product row for quick visibility
- Buttons should have icons (lucide-react: Package, Plus, Trash2, etc.)
- Mobile-friendly: stack columns on small screens

## Files to Modify
1. `prisma/schema.prisma` — data model changes
2. `src/lib/seed-data.json` — new seed data structure
3. `src/lib/seed-data.ts` — if this exists, update accordingly
4. `src/app/api/inventory/route.ts` — updated CRUD
5. `src/app/api/inventory/[id]/route.ts` — updated CRUD
6. `src/app/api/products/route.ts` — include ingredients, accept ingredients on create
7. `src/app/api/products/[id]/route.ts` — include ingredients
8. `src/app/api/products/[id]/recipes/route.ts` — refactor to work with ProductIngredient (or create new ingredients route)
9. `src/app/api/sales/route.ts` — updated deduction logic
10. `src/app/api/seed/route.ts` — updated seeding
11. `src/app/admin/productos/page.tsx` — unified inventory tab + ingredients in product form
12. `src/app/admin/materias-primas/page.tsx` — DELETE this file
13. `src/app/hub-admin/page.tsx` — remove Materias Primas card
14. `src/app/admin/layout.tsx` — check for links to materias-primas

## Verification
- Run `npm run build` and fix any TypeScript errors
- Test the full flow: create inventory item → create product with ingredients → sell product → verify stock deduction
- Visit every page in the admin panel to ensure nothing is broken
- Check that the POS (turno) still works correctly
