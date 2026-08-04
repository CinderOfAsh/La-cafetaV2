import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseProtocol(p: any) {
  return {
    ...p,
    steps: JSON.parse(p.steps || '[]'),
  }
}

// PUT — update protocol (all fields optional)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { type, name, description, steps, productId } = body

    const data: any = {}
    if (type !== undefined) data.type = type
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (steps !== undefined) data.steps = JSON.stringify(steps)
    if (productId !== undefined) data.productId = productId || null

    const protocol = await db.protocol.update({ where: { id }, data })
    return NextResponse.json({ data: parseProtocol(protocol) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete protocol
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.protocol.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
