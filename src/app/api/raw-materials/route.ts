import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SHOPPING_LIST_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

function parseMaterial(m: any) {
  const critical = m.stock < m.minStock
  const lastPurchasedAt = m.lastPurchasedAt ? new Date(m.lastPurchasedAt).getTime() : 0
  const now = Date.now()
  const recentlyPurchased = lastPurchasedAt > 0 && (now - lastPurchasedAt) < SHOPPING_LIST_TTL_MS
  // In shopping list if: critical (stock < minStock) OR recently purchased (still within 24h tachado window)
  const inShoppingList = critical || recentlyPurchased
  // Tachado = bought within last 24h
  const shoppingTachado = recentlyPurchased
  return {
    ...m,
    critical,
    inShoppingList,
    shoppingTachado,
    lastPurchasedAt: m.lastPurchasedAt,
  }
}

// GET — list all raw materials
export async function GET() {
  try {
    const items = await db.rawMaterial.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: items.map(parseMaterial) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create raw material
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, unit, stock, minStock } = body
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nombre es obligatorio' }, { status: 400 })
    }
    const item = await db.rawMaterial.create({
      data: {
        name: name.trim(),
        unit: unit || 'ud',
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
      },
    })
    return NextResponse.json({ data: parseMaterial(item) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
