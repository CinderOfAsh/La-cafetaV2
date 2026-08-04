import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST — batch create + delete assignments with max-2 validation, in a transaction
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { create = [], delete: deleteIds = [] } = body

    // Group create operations by shiftId+date to validate max 2 per shift+date
    // accounting for deletions of existing assignments in the same shift+date.
    const counts = new Map<string, number>()

    // First, get the existing counts per shift+date for items being created
    // We need: for each (shiftId, date) in create, count = (existing) - (deletions in same shift+date) + (creates in same shift+date)
    const createKeys = create.map((c: any) => `${c.shiftId}|${c.date}`)

    // Fetch existing counts for all involved shift+date combos
    const uniqueKeys = Array.from(new Set(createKeys))
    const existingMap = new Map<string, number>()
    for (const key of uniqueKeys) {
      const [shiftId, date] = key.split('|')
      const cnt = await db.shiftAssignment.count({ where: { shiftId, date } })
      existingMap.set(key, cnt)
    }

    // Fetch which deletions affect each key
    const deleteAssignments = await db.shiftAssignment.findMany({
      where: { id: { in: deleteIds } },
      select: { id: true, shiftId: true, date: true },
    })

    const deletionsPerKey = new Map<string, number>()
    for (const a of deleteAssignments) {
      const key = `${a.shiftId}|${a.date}`
      deletionsPerKey.set(key, (deletionsPerKey.get(key) || 0) + 1)
    }

    // Compute final count after operations per key
    for (const key of uniqueKeys) {
      const existing = existingMap.get(key) || 0
      const beingDeleted = deletionsPerKey.get(key) || 0
      const beingCreated = createKeys.filter((k: string) => k === key).length
      const final = existing - beingDeleted + beingCreated
      if (final > 2) {
        const [shiftId, date] = key.split('|')
        return NextResponse.json(
          { error: `No puede haber más de 2 personas en el turno ${shiftId} el ${date}` },
          { status: 400 }
        )
      }
    }

    const result = await db.$transaction(async (tx) => {
      const created: any[] = []
      for (const c of create) {
        const a = await tx.shiftAssignment.create({
          data: {
            shiftId: c.shiftId,
            userId: c.userId,
            date: c.date,
            role: c.role || 'ANOTADOR',
          },
        })
        created.push(a)
      }
      const deleted = deleteIds.length
        ? await tx.shiftAssignment.deleteMany({ where: { id: { in: deleteIds } } })
        : { count: 0 }
      return { created: created.length, deleted: deleted.count }
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
