import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST — reject swap request (called by the replacement user)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const swap = await db.shiftSwap.findUnique({ where: { id } })
    if (!swap) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }
    if (swap.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 400 })
    }

    const updated = await db.shiftSwap.update({
      where: { id },
      data: {
        status: 'REJECTED',
        decidedAt: new Date(),
        seenByReplacement: true,
        seenByOriginal: false,
      },
      include: {
        originalUser: { select: { id: true, name: true, email: true } },
        replacementUser: { select: { id: true, name: true, email: true } },
        shiftAssignment: { include: { shift: true } },
        replacementShiftAssignment: { include: { shift: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
