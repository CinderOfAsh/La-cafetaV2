import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST — mark protocol as completed for today (or given date)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const date = body?.date || new Date().toISOString().slice(0, 10)
    const user = await getCurrentUser()
    const completedBy = body?.completedBy || user?.name || null

    const completion = await db.protocolCompletion.upsert({
      where: {
        protocolId_date: { protocolId: id, date },
      },
      update: {
        completed: true,
        completedBy,
      },
      create: {
        protocolId: id,
        date,
        completed: true,
        completedBy,
      },
    })

    return NextResponse.json({ data: completion })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
