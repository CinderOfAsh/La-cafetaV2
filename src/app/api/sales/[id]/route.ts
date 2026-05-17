// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sale = await prisma.saleTransaction.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: { include: { product: true } },
      employee: { select: { id: true, name: true } },
    },
  });

  if (!sale) {
    return Response.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  return Response.json(sale);
}
