import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseProduct(p: any) {
  return {
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    customFields: JSON.parse(p.customFields || '{}'),
    recipes: (p.recipes || []).map((r: any) => ({
      ...r,
      rawMaterial: r.rawMaterial
        ? { ...r.rawMaterial, critical: r.rawMaterial.stock < r.rawMaterial.minStock }
        : r.rawMaterial,
    })),
  }
}

// PUT — update product. Body may include `recipes` array to FULL-REPLACE the recipe set.
// recipes: [{rawMaterialId, quantity}] — items not in array are deleted, existing are updated, new are created.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, price, tags, imageUrl, description, isActive, customFields, recipes } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (price !== undefined) data.price = Number(price)
    if (tags !== undefined) data.tags = JSON.stringify(tags)
    if (imageUrl !== undefined) data.imageUrl = imageUrl
    if (description !== undefined) data.description = description
    if (isActive !== undefined) data.isActive = isActive
    if (customFields !== undefined) data.customFields = JSON.stringify(customFields)

    const product = await db.$transaction(async (tx) => {
      // Update scalar fields first
      const updated = await tx.product.update({
        where: { id },
        data,
      })

      // Full-replace recipes if provided
      if (recipes !== undefined && Array.isArray(recipes)) {
        // Delete existing
        await tx.productRecipe.deleteMany({ where: { productId: id } })
        // Create new (filter invalid)
        const validRecipes = recipes
          .filter((r: any) => r.rawMaterialId && r.quantity !== undefined && Number(r.quantity) > 0)
          .map((r: any) => ({
            productId: id,
            rawMaterialId: r.rawMaterialId,
            quantity: Number(r.quantity),
          }))
        if (validRecipes.length > 0) {
          await tx.productRecipe.createMany({ data: validRecipes })
        }
      }

      // Return with relations
      return tx.product.findUnique({
        where: { id },
        include: { recipes: { include: { rawMaterial: true } }, protocol: true },
      })
    })

    return NextResponse.json({ data: parseProduct(product) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete product (cascades to recipes)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
