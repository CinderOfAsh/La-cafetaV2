import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET — current authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    return NextResponse.json({
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
