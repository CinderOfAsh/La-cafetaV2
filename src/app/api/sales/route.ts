// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (date) {
    const start = new Date(date + "T00:00:00");
    const end = new Date(date + "T23:59:59");
    where.createdAt = { gte: start, lte: end };
  }

  const sales = await prisma.saleTransaction.findMany({
    where,
    include: {
      items: true,
      employee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(sales);
}

export async function POST(request: NextRequest) {
  const { turnoId, employeeId, paymentMethod, items, total } = await request.json();

  const sale = await prisma.saleTransaction.create({
    data: {
      turnoId: turnoId || 0,
      employeeId: employeeId || null,
      paymentMethod: paymentMethod || "cash",
      total,
      items: {
        create: items.map((item: { productId: number; productName: string; price: number; quantity: number; priority: number }) => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity || 1,
          priority: item.priority || 0,
        })),
      },
    },
    include: { items: true },
  });

  for (const item of items) {
    const inv = await prisma.inventory.findUnique({
      where: { productId: item.productId },
    });
    if (inv) {
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: { stock: Math.max(0, inv.stock - (item.quantity || 1)) },
      });
    }
  }

  return Response.json(sale, { status: 201 });
}
