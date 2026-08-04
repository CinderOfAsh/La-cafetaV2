import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseShift(s: any) {
  return {
    ...s,
    openingProtocol: JSON.parse(s.openingProtocol || '[]'),
    closingProtocol: JSON.parse(s.closingProtocol || '[]'),
  }
}

// GET — list all shifts
export async function GET() {
  try {
    const shifts = await db.shift.findMany({ orderBy: { startTime: 'asc' } })
    return NextResponse.json({ data: shifts.map(parseShift) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create shift
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, startTime, endTime, daysOfWeek, openingProtocol, closingProtocol } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan: name, startTime, endTime' }, { status: 400 })
    }

    const shift = await db.shift.create({
      data: {
        name,
        startTime,
        endTime,
        daysOfWeek: daysOfWeek || '0,1,2,3,4,5,6',
        openingProtocol: JSON.stringify(openingProtocol || []),
        closingProtocol: JSON.stringify(closingProtocol || []),
      },
    })

    return NextResponse.json({ data: parseShift(shift) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
