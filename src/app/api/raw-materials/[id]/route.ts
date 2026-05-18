import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, unit, stock, minStock } = await request.json();

  const material = await prisma.rawMaterial.update({
    where: { id: parseInt(id) },
    data: { name, unit, stock, minStock },
  });

  return Response.json(material);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.rawMaterial.delete({
    where: { id: parseInt(id) },
  });

  return new Response(null, { status: 204 });
}
