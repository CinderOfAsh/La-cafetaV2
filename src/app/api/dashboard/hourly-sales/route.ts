// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  // Get all sales for the date
  const sales = await prisma.saleTransaction.findMany({
    where: {
      createdAt: {
        gte: new Date(date + "T00:00:00"),
        lte: new Date(date + "T23:59:59"),
      },
    },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by hour
  const hourlyMap = new Map<string, {
    hour: string;
    total: number;
    cash: number;
    card: number;
    count: number;
    products: { name: string; qty: number; total: number }[];
  }>();

  for (const sale of sales) {
    const hour = new Date(sale.createdAt).getHours().toString().padStart(2, "0") + ":00";
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, { hour, total: 0, cash: 0, card: 0, count: 0, products: [] });
    }
    const bucket = hourlyMap.get(hour)!;
    bucket.total += sale.total;
    bucket.count += 1;
    if (sale.paymentMethod === "cash") {
      bucket.cash += sale.total;
    } else {
      bucket.card += sale.total;
    }

    // Aggregate products in this hour
    for (const item of sale.items) {
      const existing = bucket.products.find((p) => p.name === item.productName);
      if (existing) {
        existing.qty += item.quantity;
        existing.total += item.price * item.quantity;
      } else {
        bucket.products.push({
          name: item.productName,
          qty: item.quantity,
          total: item.price * item.quantity,
        });
      }
    }
  }

  // Sort by hour
  const hourly = Array.from(hourlyMap.values()).sort((a, b) => a.hour.localeCompare(b.hour));

  // Totals
  const totals = {
    total: sales.reduce((s, t) => s + t.total, 0),
    cash: sales.filter((s) => s.paymentMethod === "cash").reduce((s, t) => s + t.total, 0),
    card: sales.filter((s) => s.paymentMethod !== "cash").reduce((s, t) => s + t.total, 0),
    count: sales.length,
  };

  return Response.json({ hourly, totals });
}
