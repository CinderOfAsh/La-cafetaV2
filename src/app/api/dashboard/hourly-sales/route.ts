import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET — hourly sales for current user
export async function GET(req: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(req.url)
    const startParam = searchParams.get('startDate')
    const endParam = searchParams.get('endDate')

    const now = new Date()
    const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    const sales = await db.saleTransaction.findMany({
      where: {
        employeeId: user.userId,
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    const hourMap = new Map<number, {
      total: number
      cash: number
      card: number
      transactions: number
      items: Map<string, { name: string; qty: number; price: number }>
    }>()
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { total: 0, cash: 0, card: 0, transactions: 0, items: new Map() })
    }
    for (const s of sales) {
      const h = new Date(s.createdAt).getHours()
      const m = hourMap.get(h)!
      if (s.paymentMethod === 'cash') m.cash += s.total
      else m.card += s.total
      m.total += s.total
      m.transactions += 1
      for (const it of s.items) {
        const key = it.productId || it.productName
        const prev = m.items.get(key) || { name: it.productName, qty: 0, price: it.price }
        prev.qty += it.quantity
        prev.price = it.price
        m.items.set(key, prev)
      }
    }

    const hourlySales = Array.from(hourMap.entries())
      .filter(([, v]) => v.transactions > 0)
      .map(([h, v]) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        total: v.total,
        cash: v.cash,
        card: v.card,
        transactions: v.transactions,
        items: Array.from(v.items.values()),
      }))

    return NextResponse.json({ data: hourlySales })
  } catch (err: any) {
    if (err.message === 'No autenticado') {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
