// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  const item = await prisma.saleItem.update({
    where: { id: parseInt(id) },
    data: { status },
  });

  return Response.json(item);
}
