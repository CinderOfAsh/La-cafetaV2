// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const today = new Date().toISOString().slice(0, 10);
  const start = startDate || today;
  const end = endDate || today;

  const dateFilter = {
    createdAt: {
      gte: new Date(start + "T00:00:00"),
      lte: new Date(end + "T23:59:59"),
    },
  };

  const [
    totalSales,
    revenueAgg,
    allSaleItems,
    allProducts,
    allInventory,
    allUsers,
    salesByHour,
    salesByPayment,
    allSwaps,
    allDebts,
  ] = await Promise.all([
    prisma.saleTransaction.count({ where: dateFilter }),
    prisma.saleTransaction.aggregate({ _sum: { total: true }, where: dateFilter }),
    prisma.saleItem.findMany({
      where: { sale: dateFilter },
      include: { product: true },
    }),
    prisma.product.findMany({ where: { isActive: true }, include: { inventory: true } }),
    prisma.inventory.findMany({ include: { product: { select: { name: true, isActive: true } } } }),
    prisma.user.findMany({ where: { isActive: true } }),
    prisma.saleTransaction.findMany({
      where: dateFilter,
      select: { createdAt: true, employeeId: true, paymentMethod: true, total: true },
    }),
    prisma.saleTransaction.groupBy({
      by: ["paymentMethod"],
      _sum: { total: true },
      _count: true,
      where: dateFilter,
    }),
    prisma.shiftSwap.findMany({
      include: { originalUser: true, replacementUser: true, shiftAssignment: { include: { shift: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.shiftDebt.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalAmount = revenueAgg._sum.total || 0;

  const productSales: Record<number, { name: string; qty: number; revenue: number }> = {};
  for (const item of allSaleItems) {
    const pid = item.productId;
    if (!productSales[pid]) productSales[pid] = { name: item.productName, qty: 0, revenue: 0 };
    productSales[pid].qty += item.quantity;
    productSales[pid].revenue += item.price * item.quantity;
  }
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const totalProductsSold = Object.values(productSales).reduce((s, p) => s + p.qty, 0);

  const employeeSales: Record<number, { name: string; count: number; total: number }> = {};
  for (const s of salesByHour) {
    const eid = s.employeeId || 0;
    if (!employeeSales[eid]) employeeSales[eid] = { name: "Sin asignar", count: 0, total: 0 };
    employeeSales[eid].count += 1;
    employeeSales[eid].total += s.total;
  }
  for (const u of allUsers) {
    if (employeeSales[u.id]) employeeSales[u.id].name = u.name;
  }
  const topEmployees = Object.values(employeeSales).sort((a, b) => b.total - a.total).slice(0, 3);

  const hourCounts: Record<string, number> = {};
  const hourRevenue: Record<string, number> = {};
  for (const s of salesByHour) {
    const h = String(s.createdAt.getHours()).padStart(2, "0") + ":00";
    hourCounts[h] = (hourCounts[h] || 0) + 1;
    hourRevenue[h] = (hourRevenue[h] || 0) + s.total;
  }
  const salesByHourArr = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour, count, revenue: hourRevenue[hour] || 0 }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const paymentMethodData = salesByPayment.map((p) => ({
    method: p.paymentMethod === "cash" ? "Efectivo" : "Datáfono",
    count: p._count,
    total: p._sum.total || 0,
  }));

  const criticalStock = allInventory
    .filter((i) => i.product.isActive && i.stock <= i.minStock)
    .map((i) => ({ name: i.product.name, stock: i.stock, minStock: i.minStock }));

  const pendingDebts = allDebts.filter((d) => !d.isPaid);

  return Response.json({
    totalSales,
    totalAmount,
    totalProductsSold,
    topProducts,
    topEmployees,
    salesByHour: salesByHourArr,
    paymentMethodData,
    criticalStock,
    swaps: allSwaps.map((s) => ({
      id: s.id,
      type: s.type,
      originalUser: s.originalUser.name,
      replacementUser: s.replacementUser.name,
      shiftName: s.shiftAssignment.shift.name,
      date: s.shiftAssignment.date,
      createdAt: s.createdAt.toISOString(),
    })),
    pendingDebts: pendingDebts.map((d) => ({
      id: d.id,
      userName: d.user.name,
      reason: d.reason,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}
