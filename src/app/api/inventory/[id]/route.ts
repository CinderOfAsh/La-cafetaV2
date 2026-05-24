// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const usedIn = await prisma.productIngredient.findMany({
    where: { inventoryId: parseInt(id) },
  });
  if (usedIn.length > 0) {
    return Response.json({ error: "Este material está siendo usado por productos" }, { status: 400 });
  }
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
  const { name, stock, minStock, unit, customFields } = await request.json();

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
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
