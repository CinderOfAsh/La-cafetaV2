import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list swaps; include originalUser, replacementUser, shiftAssignment.shift
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const where: any = {}
    if (userId) {
      where.OR = [{ originalUserId: userId }, { replacementUserId: userId }]
    }

    const swaps = await db.shiftSwap.findMany({
      where,
      include: {
        originalUser: { select: { id: true, name: true, email: true } },
        replacementUser: { select: { id: true, name: true, email: true } },
        shiftAssignment: { include: { shift: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: swaps })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create swap (type: "swap" | "substitute")
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { originalUserId, replacementUserId, shiftAssignmentId, type } = body

    if (!originalUserId || !replacementUserId || !shiftAssignmentId) {
      return NextResponse.json(
        { error: 'Faltan: originalUserId, replacementUserId, shiftAssignmentId' },
        { status: 400 }
      )
    }

    const swap = await db.shiftSwap.create({
      data: {
        originalUserId,
        replacementUserId,
        shiftAssignmentId,
        type: type || 'swap',
      },
      include: {
        originalUser: { select: { id: true, name: true, email: true } },
        replacementUser: { select: { id: true, name: true, email: true } },
        shiftAssignment: { include: { shift: true } },
      },
    })

    return NextResponse.json({ data: swap })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
