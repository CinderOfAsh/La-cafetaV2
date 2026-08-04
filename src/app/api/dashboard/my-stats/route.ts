import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET — current logged-in employee stats
export async function GET(req: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(req.url)
    const startParam = searchParams.get('startDate')
    const endParam = searchParams.get('endDate')

    const now = new Date()
    const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // My sales
    const sales = await db.saleTransaction.findMany({
      where: {
        employeeId: user.userId,
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    const totalSales = sales.reduce((s, x) => s + x.total, 0)
    let totalItems = 0
    let cashTotal = 0
    let cardTotal = 0
    for (const s of sales) {
      if (s.paymentMethod === 'cash') cashTotal += s.total
      else cardTotal += s.total
      for (const it of s.items) totalItems += it.quantity
    }

    // Shifts: dates where user had assignments within period (compare date string against start/end date parts)
    const startDateStr = start.toISOString().slice(0, 10)
    const endDateStr = end.toISOString().slice(0, 10)
    const assignments = await db.shiftAssignment.findMany({
      where: {
        userId: user.userId,
        date: { gte: startDateStr, lte: endDateStr },
      },
      include: { shift: true },
      orderBy: { date: 'asc' },
    })

    const shifts = assignments.map((a) => {
      const daySales = sales.filter((s) => s.createdAt.toISOString().slice(0, 10) === a.date)
      return {
        date: a.date,
        shiftName: a.shift.name,
        startTime: a.shift.startTime,
        endTime: a.shift.endTime,
        role: a.role,
        sales: daySales.length,
        total: daySales.reduce((sum, x) => sum + x.total, 0),
      }
    })

    // Hourly sales for the user, with items aggregated
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

    return NextResponse.json({
      data: {
        totalSales,
        totalItems,
        cashTotal,
        cardTotal,
        shifts,
        hourlySales,
      },
    })
  } catch (err: any) {
    if (err.message === 'No autenticado') {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
