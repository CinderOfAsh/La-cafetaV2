import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseShift(s: any) {
  return {
    ...s,
    openingProtocol: JSON.parse(s.openingProtocol || '[]'),
    closingProtocol: JSON.parse(s.closingProtocol || '[]'),
  }
}

// PUT — update shift (all fields optional)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, startTime, endTime, daysOfWeek, openingProtocol, closingProtocol } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (startTime !== undefined) data.startTime = startTime
    if (endTime !== undefined) data.endTime = endTime
    if (daysOfWeek !== undefined) data.daysOfWeek = daysOfWeek
    if (openingProtocol !== undefined) data.openingProtocol = JSON.stringify(openingProtocol)
    if (closingProtocol !== undefined) data.closingProtocol = JSON.stringify(closingProtocol)

    const shift = await db.shift.update({ where: { id }, data })
    return NextResponse.json({ data: parseShift(shift) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete shift
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.shift.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
