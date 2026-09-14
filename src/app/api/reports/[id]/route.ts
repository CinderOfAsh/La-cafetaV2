import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH — admin only: update report status / mark as seen
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (me.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, seenByAdmin } = body

    const update: any = {}
    if (status && ['OPEN', 'RESOLVED', 'DISMISSED'].includes(status)) {
      update.status = status
    }
    if (seenByAdmin !== undefined) {
      update.seenByAdmin = !!seenByAdmin
    }

    const report = await db.report.update({
      where: { id },
      data: update,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json({ data: report })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — admin only: delete report
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (me.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    await db.report.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
