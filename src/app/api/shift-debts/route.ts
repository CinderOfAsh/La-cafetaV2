import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list all debts with user; filter by userId, paid=false
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const paid = searchParams.get('paid')

    const where: any = {}
    if (userId) where.userId = userId
    if (paid === 'false') where.isPaid = false
    if (paid === 'true') where.isPaid = true

    const debts = await db.shiftDebt.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: debts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create debt
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, reason } = body

    if (!userId || !reason) {
      return NextResponse.json({ error: 'Faltan: userId, reason' }, { status: 400 })
    }

    const debt = await db.shiftDebt.create({
      data: { userId, reason },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ data: debt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
