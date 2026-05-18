import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json(materials);
}

export async function POST(request: NextRequest) {
  const { name, unit, stock, minStock } = await request.json();

  const material = await prisma.rawMaterial.create({
    data: {
      name,
      unit: unit || "unidad",
      stock: stock ?? 0,
      minStock: minStock ?? 5,
    },
  });

  return Response.json(material, { status: 201 });
}
