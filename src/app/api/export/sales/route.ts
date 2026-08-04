import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — export sales as CSV. Columns: date, time, employee, productName, quantity, price, paymentMethod, total
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    const now = new Date()
    const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    const sales = await db.saleTransaction.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: true,
        employee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const rows: string[] = []
    for (const s of sales) {
      const d = new Date(s.createdAt)
      const dateStr = d.toISOString().slice(0, 10)
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      const employee = s.employee?.name || ''
      for (const it of s.items) {
        const lineTotal = (it.price * it.quantity).toFixed(2)
        rows.push(
          [dateStr, timeStr, employee, it.productName, it.quantity, it.price.toFixed(2), s.paymentMethod, lineTotal]
            .map((v) => {
              const str = String(v)
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`
              }
              return str
            })
            .join(',')
        )
      }
    }

    const csv = `date,time,employee,productName,quantity,price,paymentMethod,total\n${rows.join('\n')}`
    // BOM UTF-8 for Excel
    const csvWithBom = '\uFEFF' + csv

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sales.csv"',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
