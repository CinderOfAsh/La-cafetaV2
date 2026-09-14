import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — list reports (admin only sees all, employee only sees own)
export async function GET(req: Request) {
  try {
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const onlyMine = searchParams.get('mine') === '1'

    const where: any = {}
    if (status) where.status = status
    if (me.role !== 'ADMIN' || onlyMine) {
      where.userId = me.userId
    }

    const reports = await db.report.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: reports })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create report (any authenticated user)
export async function POST(req: Request) {
  try {
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Faltan: title, description' },
        { status: 400 }
      )
    }

    const report = await db.report.create({
      data: {
        userId: me.userId,
        title: String(title).trim(),
        description: String(description).trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json({ data: report })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
