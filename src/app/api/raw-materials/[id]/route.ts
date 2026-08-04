import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseMaterial(m: any) {
  const critical = m.stock < m.minStock
  const lastPurchasedAt = m.lastPurchasedAt ? new Date(m.lastPurchasedAt).getTime() : 0
  const now = Date.now()
  const recentlyPurchased = lastPurchasedAt > 0 && (now - lastPurchasedAt) < 24 * 60 * 60 * 1000
  return {
    ...m,
    critical,
    inShoppingList: critical || recentlyPurchased,
    shoppingTachado: recentlyPurchased,
    lastPurchasedAt: m.lastPurchasedAt,
  }
}

// PUT — update raw material (name, unit, stock, minStock)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, unit, stock, minStock } = body
    const data: any = {}
    if (name !== undefined) data.name = name
    if (unit !== undefined) data.unit = unit
    if (stock !== undefined) data.stock = Number(stock)
    if (minStock !== undefined) data.minStock = Number(minStock)
    const item = await db.rawMaterial.update({ where: { id }, data })
    return NextResponse.json({ data: parseMaterial(item) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete raw material (only if not used in any recipe)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Check if used in recipes
    const recipeCount = await db.productRecipe.count({ where: { rawMaterialId: id } })
    if (recipeCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: está en uso en ${recipeCount} receta(s)` },
        { status: 400 }
      )
    }
    await db.rawMaterial.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
