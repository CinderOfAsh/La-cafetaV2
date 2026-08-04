import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — get purchase by id with items
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await db.purchase.findUnique({
      where: { id },
      include: { items: { include: { rawMaterial: true } } },
    })
    if (!item) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete purchase (reverts stock increments)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const purchase = await db.purchase.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!purchase) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    await db.$transaction(async (tx) => {
      // Revert stock increments
      for (const it of purchase.items) {
        await tx.rawMaterial.update({
          where: { id: it.rawMaterialId },
          data: { stock: { decrement: it.quantity } },
        })
      }
      await tx.purchase.delete({ where: { id } })
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
