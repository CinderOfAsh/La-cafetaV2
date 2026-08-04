import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST — mark protocol as completed for today (or given date)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const date = body?.date || new Date().toISOString().slice(0, 10)
    // Note: when no date is provided, we use server UTC date. Client should always send local date.
    const user = await getCurrentUser()
    const completedBy = body?.completedBy || user?.name || null

    // Find existing completion for this protocol + date
    const existing = await db.protocolCompletion.findFirst({
      where: { protocolId: id, date },
    })

    let completion
    if (existing) {
      completion = await db.protocolCompletion.update({
        where: { id: existing.id },
        data: { completed: true, completedBy },
      })
    } else {
      completion = await db.protocolCompletion.create({
        data: {
          protocolId: id,
          date,
          completed: true,
          completedBy,
        },
      })
    }

    return NextResponse.json({ data: completion })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
