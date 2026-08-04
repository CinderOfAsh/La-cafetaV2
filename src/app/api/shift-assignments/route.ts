import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list assignments with filters (date, userId, shiftId), includes shift and user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const userId = searchParams.get('userId')
    const shiftId = searchParams.get('shiftId')

    const where: any = {}
    if (date) where.date = date
    if (userId) where.userId = userId
    if (shiftId) where.shiftId = shiftId

    const assignments = await db.shiftAssignment.findMany({
      where,
      include: {
        shift: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ data: assignments })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create assignment; validate max 2 persons per shiftId+date
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { shiftId, userId, date, role } = body

    if (!shiftId || !userId || !date) {
      return NextResponse.json({ error: 'Faltan: shiftId, userId, date' }, { status: 400 })
    }

    // Validate max 2 persons per shift+date
    const existing = await db.shiftAssignment.count({
      where: { shiftId, date },
    })
    if (existing >= 2) {
      return NextResponse.json(
        { error: 'Ya hay 2 personas asignadas a este turno en esta fecha' },
        { status: 400 }
      )
    }

    const assignment = await db.shiftAssignment.create({
      data: {
        shiftId,
        userId,
        date,
        role: role || 'ANOTADOR',
      },
      include: {
        shift: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json({ data: assignment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
