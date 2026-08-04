import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseUser(u: any) {
  const { password, ...rest } = u
  return {
    ...rest,
    customFields: JSON.parse(u.customFields || '{}'),
  }
}

// GET — list all users (without password)
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: users.map(parseUser) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create user
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role, isActive, customFields } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Faltan: name, email' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: password || '',
        role: role || 'EMPLOYEE',
        isActive: isActive ?? true,
        customFields: JSON.stringify(customFields || {}),
      },
    })

    return NextResponse.json({ data: parseUser(user) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
