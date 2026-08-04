import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — admin dashboard stats
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startParam = searchParams.get('startDate')
    const endParam = searchParams.get('endDate')

    const now = new Date()
    const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch sales in period with items + employee
    const sales = await db.saleTransaction.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: true,
        employee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const totalSales = sales.reduce((s, x) => s + x.total, 0)
    const totalTransactions = sales.length

    // total products sold (only DELIVERED items)
    let totalProductsSold = 0
    const productAgg = new Map<string, { name: string; quantity: number; revenue: number }>()
    for (const s of sales) {
      for (const it of s.items) {
        if (it.status === 'DELIVERED') {
          totalProductsSold += it.quantity
        }
        const key = it.productId || it.productName
        const prev = productAgg.get(key) || { name: it.productName, quantity: 0, revenue: 0 }
        prev.quantity += it.quantity
        prev.revenue += it.price * it.quantity
        productAgg.set(key, prev)
      }
    }

    // star product (highest quantity sold)
    let starProduct: { name: string; quantity: number } | null = null
    for (const [_, v] of productAgg) {
      if (!starProduct || v.quantity > starProduct.quantity) {
        starProduct = { name: v.name, quantity: v.quantity }
      }
    }

    // critical stock — now based on RawMaterial
    const materials = await db.rawMaterial.findMany()
    const criticalStock = materials
      .filter((m) => m.stock < m.minStock)
      .map((m) => ({
        id: m.id,
        name: m.name,
        stock: m.stock,
        minStock: m.minStock,
        unit: m.unit,
      }))

    // top employees (top 3 by sales count + total)
    const empAgg = new Map<string, { id: string; name: string; sales: number; total: number }>()
    for (const s of sales) {
      if (!s.employee) continue
      const key = s.employee.id
      const prev = empAgg.get(key) || { id: s.employee.id, name: s.employee.name, sales: 0, total: 0 }
      prev.sales += 1
      prev.total += s.total
      empAgg.set(key, prev)
    }
    const topEmployees = Array.from(empAgg.values())
      .sort((a, b) => b.sales - a.sales || b.total - a.total)
      .slice(0, 3)

    // hourly sales: group by hour of createdAt
    const hourMap = new Map<number, { cash: number; card: number; total: number; transactions: number }>()
    for (let h = 0; h < 24; h++) hourMap.set(h, { cash: 0, card: 0, total: 0, transactions: 0 })
    for (const s of sales) {
      const h = new Date(s.createdAt).getHours()
      const m = hourMap.get(h)!
      if (s.paymentMethod === 'cash') m.cash += s.total
      else m.card += s.total
      m.total += s.total
      m.transactions += 1
    }
    const hourlySales = Array.from(hourMap.entries())
      .map(([h, v]) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        cash: v.cash,
        card: v.card,
        total: v.total,
        transactions: v.transactions,
      }))

    // payment methods
    let cashTotal = 0
    let cardTotal = 0
    for (const s of sales) {
      if (s.paymentMethod === 'cash') cashTotal += s.total
      else cardTotal += s.total
    }
    const grand = cashTotal + cardTotal
    const paymentMethods = {
      cash: cashTotal,
      card: cardTotal,
      cashPct: grand > 0 ? Math.round((cashTotal / grand) * 100) : 0,
      cardPct: grand > 0 ? Math.round((cardTotal / grand) * 100) : 0,
    }

    // top products (top 10 by quantity)
    const topProducts = Array.from(productAgg.entries())
      .map(([id, v]) => ({ id, name: v.name, quantity: v.quantity, revenue: v.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // swaps in period
    const swaps = await db.shiftSwap.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        originalUser: { select: { id: true, name: true, email: true } },
        replacementUser: { select: { id: true, name: true, email: true } },
        shiftAssignment: { include: { shift: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // purchases (suministros) in period
    const purchases = await db.purchase.findMany({
      where: { date: { gte: start, lte: end } },
      include: { items: true },
      orderBy: { date: 'desc' },
    })
    const totalPurchases = purchases.reduce((s, p) => s + p.totalAmount, 0)
    const purchasesCount = purchases.length
    const recentPurchases = purchases.slice(0, 10).map((p) => ({
      id: p.id,
      date: p.date.toISOString(),
      supplier: p.supplier,
      totalAmount: p.totalAmount,
      itemCount: p.items.length,
    }))

    return NextResponse.json({
      data: {
        totalSales,
        totalTransactions,
        totalProductsSold,
        starProduct,
        criticalStock,
        topEmployees,
        hourlySales,
        paymentMethods,
        topProducts,
        swaps,
        totalPurchases,
        purchasesCount,
        recentPurchases,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
