// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const where: Record<string, unknown> = {};
  if (start && end) {
    where.createdAt = {
      gte: new Date(start + "T00:00:00"),
      lte: new Date(end + "T23:59:59"),
    };
  }

  const sales = await prisma.saleTransaction.findMany({
    where,
    include: { items: { include: { product: true } }, employee: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = sales.map((s) => ({
    ID: s.id,
    Fecha: s.createdAt.toISOString().slice(0, 10),
    Hora: s.createdAt.toISOString().slice(11, 16),
    Empleado: s.employee?.name ?? "N/A",
    MetodoPago: s.paymentMethod === "cash" ? "Efectivo" : "Datáfono",
    Total: s.total,
    Items: s.items.map((i) => `${i.productName} x${i.quantity}`).join(", "),
  }));

  return Response.json(rows);
}
