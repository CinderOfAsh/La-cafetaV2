import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

// GET — auto-login as the first active non-ADMIN user (no password, per spec)
export async function GET() {
  try {
    const employee = await db.user.findFirst({
      where: {
        isActive: true,
        role: { not: 'ADMIN' },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'No existe ningún empleado activo' },
        { status: 404 }
      )
    }

    const token = createToken({
      userId: employee.id,
      role: employee.role,
      name: employee.name,
      email: employee.email,
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
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
