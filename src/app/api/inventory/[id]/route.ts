// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.inventory.delete({
    where: { id: parseInt(id) },
  });
  return Response.json({ ok: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { stock, minStock, unit, customFields } = await request.json();

  const data: Record<string, unknown> = {};
  if (stock !== undefined) data.stock = stock;
  if (minStock !== undefined) data.minStock = minStock;
  if (unit !== undefined) data.unit = unit;
  if (customFields !== undefined) data.customFields = typeof customFields === "string" ? customFields : JSON.stringify(customFields);

  const inv = await prisma.inventory.update({
    where: { id: parseInt(id) },
    data,
  });

  return Response.json(inv);
}
