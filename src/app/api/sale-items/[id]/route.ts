import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT — update sale item (status, priority)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, priority } = body

    const data: any = {}
    if (status !== undefined) data.status = status
    if (priority !== undefined) data.priority = Number(priority)

    const item = await db.saleItem.update({ where: { id }, data })
    return NextResponse.json({ data: item })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete sale item
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.saleItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
