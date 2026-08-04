import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseProtocol(p: any) {
  return {
    ...p,
    steps: JSON.parse(p.steps || '[]'),
  }
}

// GET — list protocols; filter by type, productId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')

    const where: any = {}
    if (type) where.type = type
    if (productId) where.productId = productId

    const protocols = await db.protocol.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: protocols.map(parseProtocol) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create protocol; if productId given, delete any existing protocol for that product first (unique constraint)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, name, description, steps, productId } = body

    if (!type || !name || steps === undefined) {
      return NextResponse.json({ error: 'Faltan: type, name, steps' }, { status: 400 })
    }

    if (productId) {
      await db.protocol.deleteMany({ where: { productId } })
    }

    const protocol = await db.protocol.create({
      data: {
        type,
        name,
        description: description || null,
        steps: JSON.stringify(steps),
        productId: productId || null,
      },
    })

    return NextResponse.json({ data: parseProtocol(protocol) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
