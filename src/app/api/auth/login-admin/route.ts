import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

// GET — auto-login as the first ADMIN user (no password, per spec)
export async function GET() {
  try {
    const admin = await db.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'No existe ningún usuario administrador' },
        { status: 404 }
      )
    }

    const token = createToken({
      userId: admin.id,
      role: admin.role,
      name: admin.name,
      email: admin.email,
    })

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
