import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseInventory(i: any) {
  return {
    ...i,
    customFields: JSON.parse(i.customFields || '{}'),
  }
}

// PUT — update inventory (stock, minStock, unit, customFields — all optional)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { stock, minStock, unit, customFields } = body

    const data: any = {}
    if (stock !== undefined) data.stock = Number(stock)
    if (minStock !== undefined) data.minStock = Number(minStock)
    if (unit !== undefined) data.unit = unit
    if (customFields !== undefined) data.customFields = JSON.stringify(customFields)

    const item = await db.inventory.update({
      where: { id },
      data,
      include: { product: true },
    })

    return NextResponse.json({ data: parseInventory(item) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
