import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseProduct(p: any) {
  return {
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    customFields: JSON.parse(p.customFields || '{}'),
  }
}

// PUT — update product (all fields optional)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, price, tags, imageUrl, description, isActive, customFields } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (price !== undefined) data.price = Number(price)
    if (tags !== undefined) data.tags = JSON.stringify(tags)
    if (imageUrl !== undefined) data.imageUrl = imageUrl
    if (description !== undefined) data.description = description
    if (isActive !== undefined) data.isActive = isActive
    if (customFields !== undefined) data.customFields = JSON.stringify(customFields)

    const product = await db.product.update({
      where: { id },
      data,
      include: { inventory: true },
    })

    return NextResponse.json({ data: parseProduct(product) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete product (cascades to inventory)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
