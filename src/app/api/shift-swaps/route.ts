import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseSwap(s: any) {
  return {
    ...s,
    shiftAssignment: s.shiftAssignment
      ? {
          ...s.shiftAssignment,
          openingProtocol: safeParseArr(s.shiftAssignment.openingProtocol),
          closingProtocol: safeParseArr(s.shiftAssignment.closingProtocol),
        }
      : s.shiftAssignment,
    replacementShiftAssignment: s.replacementShiftAssignment
      ? {
          ...s.replacementShiftAssignment,
          openingProtocol: safeParseArr(s.replacementShiftAssignment.openingProtocol),
          closingProtocol: safeParseArr(s.replacementShiftAssignment.closingProtocol),
        }
      : null,
  }
}

function safeParseArr(v: any): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return [] }
  }
  return []
}

// GET — list swaps; include originalUser, replacementUser, shiftAssignment.shift
// Query params: userId (filter by original OR replacement), pendingFor=userId (PENDING + unseen by that user as replacement)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const pendingFor = searchParams.get('pendingFor')
    const responseFor = searchParams.get('responseFor') // swaps that have been decided but not seen by this user (as original)

    const where: any = {}
    if (userId) {
      where.OR = [{ originalUserId: userId }, { replacementUserId: userId }]
    }
    if (pendingFor) {
      // PENDING swaps where this user is the replacement AND hasn't seen
      where.AND = [
        { replacementUserId: pendingFor },
        { status: 'PENDING' },
      ]
    }
    if (responseFor) {
      // Decided swaps (APPROVED or REJECTED) where this user is the original AND hasn't seen the response
      where.AND = [
        { originalUserId: responseFor },
        { status: { in: ['APPROVED', 'REJECTED'] } },
        { seenByOriginal: false },
      ]
    }

    const swaps = await db.shiftSwap.findMany({
      where,
      include: {
        originalUser: { select: { id: true, name: true, email: true } },
        replacementUser: { select: { id: true, name: true, email: true } },
        shiftAssignment: { include: { shift: true } },
        replacementShiftAssignment: { include: { shift: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: swaps.map(parseSwap) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create swap request
// Body: { originalUserId, replacementUserId, shiftAssignmentId, type, replacementShiftAssignmentId? }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { originalUserId, replacementUserId, shiftAssignmentId, type, replacementShiftAssignmentId } = body

    if (!originalUserId || !replacementUserId || !shiftAssignmentId) {
      return NextResponse.json(
        { error: 'Faltan: originalUserId, replacementUserId, shiftAssignmentId' },
        { status: 400 }
      )
    }

    // Check there's no existing PENDING swap for this assignment
    const existing = await db.shiftSwap.findFirst({
      where: { shiftAssignmentId, status: 'PENDING' },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya hay una solicitud pendiente para este turno' },
        { status: 400 }
      )
    }

    const swap = await db.shiftSwap.create({
      data: {
        originalUserId,
        replacementUserId,
        shiftAssignmentId,
        type: type || 'swap',
        replacementShiftAssignmentId: replacementShiftAssignmentId || null,
        status: 'PENDING',
      },
      include: {
        originalUser: { select: { id: true, name: true, email: true } },
        replacementUser: { select: { id: true, name: true, email: true } },
        shiftAssignment: { include: { shift: true } },
        replacementShiftAssignment: { include: { shift: true } },
      },
    })

    return NextResponse.json({ data: parseSwap(swap) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
