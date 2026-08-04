import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT — mark debt as paid
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const debt = await db.shiftDebt.update({
      where: { id },
      data: { isPaid: true },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json({ data: debt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
