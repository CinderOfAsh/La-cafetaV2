// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return Response.json({ error: "No autorizado" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: "Sesión expirada" }, { status: 401 });

  const userId = payload.userId;

  const assignments = await prisma.shiftAssignment.findMany({
    where: { userId },
    include: { shift: true },
    orderBy: { date: "desc" },
    take: 30,
  });

  const sales = await prisma.saleTransaction.findMany({
    where: { employeeId: userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = sales.reduce((s, t) => s + t.total, 0);
  const totalItems = sales.reduce((s, t) => s + t.items.reduce((is, i) => is + i.quantity, 0), 0);

  const cashTotal = sales.filter((s) => s.paymentMethod === "cash").reduce((s, t) => s + t.total, 0);
  const cardTotal = sales.filter((s) => s.paymentMethod !== "cash").reduce((s, t) => s + t.total, 0);

  const firstSale = sales.length > 0 ? sales[sales.length - 1].createdAt.toISOString() : null;
  const lastSale = sales.length > 0 ? sales[0].createdAt.toISOString() : null;

  const shiftHistory = assignments.map((a) => ({
    id: a.id,
    date: a.date,
    shiftName: a.shift.name,
    startTime: a.shift.startTime,
    endTime: a.shift.endTime,
    role: a.role,
    salesCount: sales.filter((s) => {
      const saleDate = s.createdAt.toISOString().slice(0, 10);
      return saleDate === a.date;
    }).length,
    salesTotal: sales
      .filter((s) => s.createdAt.toISOString().slice(0, 10) === a.date)
      .reduce((sum, s) => sum + s.total, 0),
  }));

  return Response.json({
    totalAmount,
    totalItems,
    cashTotal,
    cardTotal,
    firstSale,
    lastSale,
    totalShifts: assignments.length,
    shiftHistory,
  });
}
