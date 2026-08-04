import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST — mark swap as seen by a user (so it doesn't pop up again)
// Body: { as: "original" | "replacement" }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const as = body.as // "original" | "replacement"

    const data: any = {}
    if (as === 'original') data.seenByOriginal = true
    else if (as === 'replacement') data.seenByReplacement = true
    else return NextResponse.json({ error: 'Falta parámetro "as"' }, { status: 400 })

    const updated = await db.shiftSwap.update({
      where: { id },
      data,
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
