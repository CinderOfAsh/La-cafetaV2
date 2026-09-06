import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

// POST — login como ADMIN protegido por contraseña.
// Contraseña del PANEL DE ADMIN (no del usuario), definida en env var
// ADMIN_PANEL_PASSWORD. Default: "Horche".
export async function POST(req: Request) {
  try {
    const expected = process.env.ADMIN_PANEL_PASSWORD ?? 'Horche'
    const body = await req.json().catch(() => ({}))
    const provided = typeof body.password === 'string' ? body.password : ''

    if (provided !== expected) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

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
