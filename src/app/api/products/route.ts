// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const products = await prisma.product.findMany({
    where,
    include: {
      inventory: { select: { id: true, stock: true, minStock: true, unit: true } },
      ingredients: {
        include: {
          inventory: { select: { id: true, name: true, stock: true, unit: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(products);
}

export async function POST(request: NextRequest) {
  const { name, price, tags, imageUrl, description, customFields, ingredients } = await request.json();

  const product = await prisma.product.create({
    data: {
      name,
      price,
      tags: JSON.stringify(tags || []),
      imageUrl: imageUrl || "",
      description: description || "",
      customFields: customFields ? JSON.stringify(customFields) : "{}",
    },
  });

  await prisma.inventory.create({
    data: {
      name: name,
      productId: product.id,
      stock: 0,
      minStock: 5,
      unit: "unidad",
    },
  });

  if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
    for (const ing of ingredients) {
      await prisma.productIngredient.create({
        data: {
          productId: product.id,
          inventoryId: ing.inventoryId,
          quantity: ing.quantity ?? 1,
          unit: ing.unit || "unidad",
        },
      });
    }
  }

  const fullProduct = await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      inventory: { select: { id: true, stock: true, minStock: true, unit: true } },
      ingredients: {
        include: {
          inventory: { select: { id: true, name: true, stock: true, unit: true } },
        },
      },
    },
  });

  return Response.json(fullProduct, { status: 201 });
}
