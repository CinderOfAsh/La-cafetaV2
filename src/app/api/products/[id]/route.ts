// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      inventory: { select: { stock: true, minStock: true, unit: true } },
      recipes: {
        include: { rawMaterial: true },
      },
    },
  });

  if (!product) {
    return Response.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return Response.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, price, tags, imageUrl, description, isActive, customFields } = await request.json();

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (price !== undefined) data.price = price;
  if (tags !== undefined) data.tags = typeof tags === "string" ? tags : JSON.stringify(tags);
  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (description !== undefined) data.description = description;
  if (isActive !== undefined) data.isActive = isActive;
  if (customFields !== undefined) data.customFields = typeof customFields === "string" ? customFields : JSON.stringify(customFields);

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data,
  });

  return Response.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Delete related records first
  await prisma.saleItem.deleteMany({ where: { productId: parseInt(id) } });
  await prisma.protocol.deleteMany({ where: { productId: parseInt(id) } });
  await prisma.inventory.deleteMany({ where: { productId: parseInt(id) } });
  await prisma.productRecipe.deleteMany({ where: { productId: parseInt(id) } });
  // Then delete the product
  await prisma.product.delete({
    where: { id: parseInt(id) },
  });
  return Response.json({ ok: true });
}
