import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseMaterial(m: any) {
  return {
    ...m,
    critical: m.stock < m.minStock,
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
