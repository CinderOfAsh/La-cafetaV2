import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — sale by id with items
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sale = await db.saleTransaction.findUnique({
      where: { id },
      include: {
        items: true,
        employee: { select: { id: true, name: true } },
      },
    })
    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ data: sale })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
