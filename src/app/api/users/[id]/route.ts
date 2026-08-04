import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseUser(u: any) {
  const { password, ...rest } = u
  return {
    ...rest,
    customFields: JSON.parse(u.customFields || '{}'),
  }
}

// PUT — update user (if password is empty string, do not update it)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, email, password, role, isActive, customFields } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (password !== undefined && password !== '') data.password = password
    if (role !== undefined) data.role = role
    if (isActive !== undefined) data.isActive = isActive
    if (customFields !== undefined) data.customFields = JSON.stringify(customFields)

    const user = await db.user.update({ where: { id }, data })
    return NextResponse.json({ data: parseUser(user) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — delete user
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
