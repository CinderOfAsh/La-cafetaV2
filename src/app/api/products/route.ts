import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseProduct(p: any) {
  return {
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    customFields: JSON.parse(p.customFields || '{}'),
  }
}

// GET — list all products (optionally filter active=true), includes inventory
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')

    const products = await db.product.findMany({
      where: active === 'true' ? { isActive: true } : active === 'false' ? { isActive: false } : undefined,
      include: { inventory: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: products.map(parseProduct) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create product with default inventory (stock=0, minStock=0, unit="ud")
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, price, tags, imageUrl, description, isActive, customFields } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos: name, price' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name,
        price: Number(price),
        tags: JSON.stringify(tags || []),
        imageUrl: imageUrl || null,
        description: description || null,
        isActive: isActive ?? true,
        customFields: JSON.stringify(customFields || {}),
        inventory: {
          create: { stock: 0, minStock: 0, unit: 'ud' },
        },
      },
      include: { inventory: true },
    })

    return NextResponse.json({ data: parseProduct(product) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
