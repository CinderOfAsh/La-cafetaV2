// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingredients = await prisma.productIngredient.findMany({
    where: { productId: parseInt(id) },
    include: { inventory: true },
  });
  return Response.json(ingredients);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { inventoryId, quantity, unit } = await request.json();

  const ingredient = await prisma.productIngredient.create({
    data: {
      productId: parseInt(id),
      inventoryId,
      quantity: quantity ?? 1,
      unit: unit || "unidad",
    },
    include: { inventory: true },
  });

  return Response.json(ingredient, { status: 201 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ingredients } = await request.json();

  await prisma.productIngredient.deleteMany({ where: { productId: parseInt(id) } });

  if (ingredients && Array.isArray(ingredients)) {
    for (const ing of ingredients) {
      await prisma.productIngredient.create({
        data: {
          productId: parseInt(id),
          inventoryId: ing.inventoryId,
          quantity: ing.quantity ?? 1,
          unit: ing.unit || "unidad",
        },
      });
    }
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { inventoryId } = await request.json();

  const where: any = { productId: parseInt(id) };
  if (inventoryId && inventoryId !== 0) {
    where.inventoryId = inventoryId;
  }

  await prisma.productIngredient.deleteMany({ where });

  return new Response(null, { status: 204 });
}
