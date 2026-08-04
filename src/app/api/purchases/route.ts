import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list purchases, optional date range filter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const source = searchParams.get('source') // "manual" | "shopping-list"

    const where: any = {}
    if (start || end) {
      where.date = {}
      if (start) where.date.gte = new Date(start + 'T00:00:00.000Z')
      if (end) where.date.lte = new Date(end + 'T23:59:59.999Z')
    }
    if (source) where.source = source

    const items = await db.purchase.findMany({
      where,
      include: {
        items: { include: { rawMaterial: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: items })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create purchase with items, increment rawMaterial.stock, set totalAmount
// Body: { date?, supplier?, notes?, source?: "manual" | "shopping-list", items: [{rawMaterialId, quantity, unitPrice}] }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, supplier, notes, items, source = 'manual' } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'La compra debe tener al menos un item' }, { status: 400 })
    }

    const validItems = items
      .filter((it: any) => it.rawMaterialId && Number(it.quantity) > 0)
      .map((it: any) => ({
        rawMaterialId: it.rawMaterialId,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice) || 0,
        subtotal: Number(it.quantity) * (Number(it.unitPrice) || 0),
      }))

    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No hay items válidos' }, { status: 400 })
    }

    const totalAmount = validItems.reduce((s, it) => s + it.subtotal, 0)

    const purchase = await db.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          date: date ? new Date(date) : new Date(),
          supplier: supplier || null,
          notes: notes || null,
          totalAmount,
          source,
          items: { create: validItems },
        },
        include: { items: { include: { rawMaterial: true } } },
      })

      // Increment raw material stock + set lastPurchasedAt for each item
      const now = new Date()
      for (const it of validItems) {
        await tx.rawMaterial.update({
          where: { id: it.rawMaterialId },
          data: {
            stock: { increment: it.quantity },
            lastPurchasedAt: now,
          },
        })
      }

      return created
    })

    return NextResponse.json({ data: purchase })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
