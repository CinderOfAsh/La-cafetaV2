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
      inventory: { select: { stock: true, minStock: true, unit: true } },
      recipes: {
        include: { rawMaterial: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(products);
}

export async function POST(request: NextRequest) {
  const { name, price, tags, imageUrl, description, customFields } = await request.json();

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
      productId: product.id,
      stock: 0,
      minStock: 5,
      unit: "unidad",
    },
  });

  return Response.json(product, { status: 201 });
}
