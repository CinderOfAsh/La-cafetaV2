# PROMPT 3/5 — MERGE RAW MATERIALS INTO PRODUCTS + STOCK ON SALES

## OBJECTIVE
Remove the separate Raw Materials section. All "materials" are now Products with stock. Products can be ingredients of other products. Selling reduces stock.

---

## 1. ELIMINAR MATERIAS PRIMAS DEL ADMIN

Remove the "Materias Primas" link from `src/app/hub-admin/page.tsx` — remove the card with `href: '/admin/materias-primas'`.

Remove the entire page at `src/app/admin/materias-primas/page.tsx`.

Remove all API routes under `src/app/api/raw-materials/`.

Remove the "Materias Primas" tab from `src/app/admin/productos/page.tsx` if it exists there.

---

## 2. PRODUCTS GET STOCK FIELD

Products already have `stock` and `minStock` in the Prisma schema. Make sure the Products admin page (`src/app/admin/productos/page.tsx`) shows:
- **Stock** field when adding/editing a product (number input)
- **Min stock** field (number input)
- **Category** dropdown when adding/editing
- Stock warning: if stock < minStock, show a small red indicator

Also add a search bar to filter products by name.

---

## 3. PRODUCTS CAN BE INGREDIENTS OF OTHER PRODUCTS

In the product edit form (inside `src/app/admin/productos/page.tsx`), add a section called "Ingredientes":

- Show a list of all other products (excluding the current one)
- Each ingredient has a quantity field (number)
- When a sale is made, reduce stock of ALL ingredient products by their quantities

This uses the existing `ProductRecipe` model or a new approach: store ingredients as a JSON field on the product, or create a self-referencing many-to-many.

Simplest approach: add a JSON field `ingredients` to the Product model:
```prisma
model Product {
  ...
  ingredients String @default("[]") // JSON: [{ "productId": 1, "quantity": 2 }]
}
```

But since we shouldn't change Prisma schema in this prompt, use the existing `ProductRecipe` model which already links products to raw materials. Instead, create a new simple relation or repurpose it.

Actually, best approach: since we're removing RawMaterial, we need to update the schema. Run `npx prisma migrate dev --name remove-raw-materials` after:

1. Delete `model RawMaterial` and `model ProductRecipe` from schema.prisma
2. Add `stock Int @default(0)` and `minStock Int @default(5)` to Product (if not there)
3. Add `ingredients String @default("[]")` to Product (JSON array of { productId, quantity })
4. Run migration
5. Update seed script

---

## 4. STOCK REDUCTION ON SALE

In `src/app/api/sales/route.ts`, when creating a sale:
- For each item sold, find the product
- Reduce the product's stock by the quantity sold
- Also check the product's ingredients (JSON field): for each ingredient product, reduce its stock too
- If any product doesn't have enough stock, return error 400 with message "Stock insuficiente para [product name]"

---

## 5. ADMIN PRODUCTOS PAGE

Update `src/app/admin/productos/page.tsx` to show:
- Table columns: Name, Category, Price, Stock, Min Stock, Active
- Add/edit form: Name, Price, Category (dropdown), Stock (number), Min Stock (number), Ingredients (multi-select with quantity)
- Stock warning badge when stock < minStock
- Search bar
- Category filter

---

## 6. POS SHOW STOCK

In `src/app/turno/page.tsx`, show remaining stock on each product card. If stock is 0, gray out the card and don't allow clicking.

---

## 7. UPDATE SEED

Update `src/app/lib/seed-data.ts` to set stock values for products and remove raw materials from the seed.

---

## IMPORTANT
- Do NOT change visual design, colors, or fonts
- `npm run build` must pass
- Products page becomes the single place to manage everything (products, stock, ingredients)

## FILES TO MODIFY/CREATE
- `prisma/schema.prisma` — remove RawMaterial/ProductRecipe, add ingredients JSON to Product
- `src/app/hub-admin/page.tsx` — remove materias-primas card
- `src/app/admin/materias-primas/page.tsx` — DELETE this file
- `src/app/api/raw-materials/` — DELETE this folder
- `src/app/api/raw-materials/[id]/` — DELETE this folder
- `src/app/admin/productos/page.tsx` — major update: stock, minStock, ingredients, categories, search
- `src/app/api/products/route.ts` — update to include stock/ingredients
- `src/app/api/sales/route.ts` — add stock reduction logic
- `src/app/turno/page.tsx` — show stock on product cards
- `src/app/lib/seed-data.ts` — update seed
