// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");

  const where: Record<string, unknown> = {};
  if (productId) {
    where.productId = parseInt(productId);
  }

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, price: true, isActive: true, customFields: true },
      },
      usedIn: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(inventory);
}

export async function POST(request: NextRequest) {
  const { name, productId, stock, minStock, unit, customFields } = await request.json();

  const inv = await prisma.inventory.create({
    data: {
      name: name || "",
      productId: productId || null,
      stock: stock ?? 0,
      minStock: minStock ?? 5,
      unit: unit || "unidad",
      customFields: customFields ? (typeof customFields === "string" ? customFields : JSON.stringify(customFields)) : "{}",
    },
  });

  return Response.json(inv, { status: 201 });
}
