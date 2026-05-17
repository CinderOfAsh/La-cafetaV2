// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET() {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        select: { id: true, name: true, price: true, isActive: true, customFields: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return Response.json(inventory);
}
