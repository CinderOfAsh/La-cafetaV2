import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST — approve swap request (called by the replacement user)
// This processes the exchange: swaps the userId on both assignments (for "swap" type)
// or just reassigns the assignment to the replacement (for "substitute" type)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { replacementShiftAssignmentId } = body

    const swap = await db.shiftSwap.findUnique({
      where: { id },
      include: { shiftAssignment: true },
    })

    if (!swap) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (swap.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      if (swap.type === 'swap') {
        // SWAP: exchange the two assignments between users
        // The original assignment goes to the replacement user
        // The replacement's assignment goes to the original user
        const replacementAssignmentId = replacementShiftAssignmentId || swap.replacementShiftAssignmentId

        if (!replacementAssignmentId) {
          throw new Error('Falta el turno del reemplazo para el intercambio')
        }

        const replacementAssignment = await tx.shiftAssignment.findUnique({
          where: { id: replacementAssignmentId },
        })

        if (!replacementAssignment) {
          throw new Error('El turno del reemplazo no existe')
        }

        // Swap the userId on both assignments
        await tx.shiftAssignment.update({
          where: { id: swap.shiftAssignmentId },
          data: { userId: replacementAssignment.userId },
        })
        await tx.shiftAssignment.update({
          where: { id: replacementAssignmentId },
          data: { userId: swap.originalUserId },
        })
      } else {
        // SUBSTITUTE: the replacement takes over the original's assignment
        await tx.shiftAssignment.update({
          where: { id: swap.shiftAssignmentId },
          data: { userId: swap.replacementUserId },
        })
      }

      // Mark swap as approved
      await tx.shiftSwap.update({
        where: { id },
        data: {
          status: 'APPROVED',
          decidedAt: new Date(),
          seenByReplacement: true, // the replacement just decided, so they've seen it
          seenByOriginal: false,   // the original hasn't seen the response yet
          replacementShiftAssignmentId: replacementShiftAssignmentId || swap.replacementShiftAssignmentId,
        },
      })
    })

    const updated = await db.shiftSwap.findUnique({
      where: { id },
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
