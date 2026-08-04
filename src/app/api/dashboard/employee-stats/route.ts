import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { localDateStrServer } from '@/lib/server-date'

// GET /api/dashboard/employee-stats?userId=...  →  stats for a single employee
// GET /api/dashboard/employee-stats  →  stats for ALL employees (array)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const today = localDateStrServer(new Date())

    const userWhere = userId ? { id: userId, isActive: true, role: { not: 'ADMIN' } } : { isActive: true, role: { not: 'ADMIN' } }
    const users = await db.user.findMany({ where: userWhere, orderBy: { name: 'asc' } })

    // Fetch all assignments (with shift) — we'll filter per user
    const assignments = await db.shiftAssignment.findMany({
      include: { shift: true },
      orderBy: { date: 'asc' },
    })

    // Fetch all swaps
    const swaps = await db.shiftSwap.findMany()

    // Fetch all sales
    const sales = await db.saleTransaction.findMany({ include: { items: true } })

    const result = await Promise.all(users.map(async (u) => {
      const userAssignments = assignments.filter((a) => a.userId === u.id)
      const userSwapsRequested = swaps.filter((s) => s.originalUserId === u.id)
      const userSwapsReceived = swaps.filter((s) => s.replacementUserId === u.id)
      const userSales = sales.filter((s) => s.employeeId === u.id)

      const upcoming = userAssignments.filter((a) => a.date >= today)
      const past = userAssignments.filter((a) => a.date < today)

      const roleCount = {
        CAMARERO: userAssignments.filter((a) => a.role === 'CAMARERO').length,
        COCINERO: userAssignments.filter((a) => a.role === 'COCINERO').length,
      }

      const swapsApproved = userSwapsReceived.filter((s) => s.status === 'APPROVED').length
      const swapsRejected = userSwapsReceived.filter((s) => s.status === 'REJECTED').length

      const totalRevenue = userSales.reduce((s, x) => s + x.total, 0)
      const cashRevenue = userSales.filter((s) => s.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0)
      const cardRevenue = userSales.filter((s) => s.paymentMethod === 'card').reduce((s, x) => s + x.total, 0)
      const totalItems = userSales.reduce((s, x) => s + (x.items?.reduce((acc, it) => acc + it.quantity, 0) || 0), 0)

      return {
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        userRole: u.role,
        totalShiftsAssigned: userAssignments.length,
        upcomingShifts: upcoming.length,
        pastShifts: past.length,
        shiftList: userAssignments.map((a) => ({
          id: a.id,
          date: a.date,
          shiftName: a.shift?.name || '—',
          startTime: a.shift?.startTime || '',
          endTime: a.shift?.endTime || '',
          role: a.role,
          isPast: a.date < today,
        })),
        swapsRequested: userSwapsRequested.length,
        swapsReceived: userSwapsReceived.length,
        swapsApproved,
        swapsRejected,
        roleCount,
        totalSales: userSales.length,
        totalItems,
        totalRevenue,
        cashRevenue,
        cardRevenue,
      }
    }))

    if (userId) {
      return NextResponse.json({ data: result[0] || null })
    }
    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
