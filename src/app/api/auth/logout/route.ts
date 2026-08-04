import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET — delete the token cookie
export async function GET() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('token')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
