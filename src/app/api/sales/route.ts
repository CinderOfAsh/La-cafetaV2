import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list sales; filter by date (createdAt date part), employeeId; include items + employee
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')

    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (date) {
      // compare date part of createdAt (stored as ISO). Use gte/lt for the day.
      const start = new Date(`${date}T00:00:00.000Z`)
      const end = new Date(`${date}T23:59:59.999Z`)
      where.createdAt = { gte: start, lte: end }
    }

    const sales = await db.saleTransaction.findMany({
      where,
      include: {
        items: true,
        employee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: sales })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create sale + sale items, decrement raw materials stock based on each product's recipe
// For each item with productId, fetch the product's ProductRecipe entries and decrement each RawMaterial.stock by quantity*recipe.quantity
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { employeeId, items = [], paymentMethod = 'cash', total } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'La venta debe tener al menos un item' }, { status: 400 })
    }

    const sale = await db.$transaction(async (tx) => {
      const created = await tx.saleTransaction.create({
        data: {
          employeeId: employeeId || null,
          total: Number(total),
          paymentMethod,
          items: {
            create: items.map((it: any, idx: number) => ({
              productId: it.productId || null,
              productName: it.productName,
              price: Number(it.price),
              quantity: Number(it.quantity),
              priority: idx,
              status: 'PENDING',
            })),
          },
        },
        include: { items: true, employee: { select: { id: true, name: true } } },
      })

      // Decrement raw materials based on each product's recipe
      for (const it of items) {
        const pid = it.productId
        if (!pid) continue
        const qty = Number(it.quantity) || 0
        if (qty <= 0) continue
        // Fetch recipes for this product
        const recipes = await tx.productRecipe.findMany({
          where: { productId: pid },
        })
        for (const recipe of recipes) {
          const decrementBy = recipe.quantity * qty
          if (decrementBy > 0) {
            await tx.rawMaterial.update({
              where: { id: recipe.rawMaterialId },
              data: { stock: { decrement: decrementBy } },
            })
          }
        }
      }

      return created
    })

    return NextResponse.json({ data: sale })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
