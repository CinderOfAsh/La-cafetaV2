import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseInventory(i: any) {
  return {
    ...i,
    customFields: JSON.parse(i.customFields || '{}'),
  }
}

// GET — list all inventory items with product included
export async function GET() {
  try {
    const items = await db.inventory.findMany({
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    })
    return NextResponse.json({ data: items.map(parseInventory) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
