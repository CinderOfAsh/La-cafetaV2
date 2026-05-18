import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipes = await prisma.productRecipe.findMany({
    where: { productId: parseInt(id) },
    include: { rawMaterial: true },
  });
  return Response.json(recipes);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rawMaterialId, quantity } = await request.json();

  const recipe = await prisma.productRecipe.create({
    data: {
      productId: parseInt(id),
      rawMaterialId,
      quantity: quantity ?? 1,
    },
    include: { rawMaterial: true },
  });

  return Response.json(recipe, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rawMaterialId } = await request.json();

  const where: any = { productId: parseInt(id) };
  if (rawMaterialId && rawMaterialId !== 0) {
    where.rawMaterialId = rawMaterialId;
  }

  await prisma.productRecipe.deleteMany({ where });

  return new Response(null, { status: 204 });
}
