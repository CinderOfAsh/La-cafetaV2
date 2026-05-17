// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type, name, description, steps, productId } = await request.json();

  const data: Record<string, unknown> = {};
  if (type !== undefined) data.type = type;
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (steps !== undefined) data.steps = typeof steps === "string" ? steps : JSON.stringify(steps);
  if (productId !== undefined) data.productId = productId;

  const protocol = await prisma.protocol.update({
    where: { id: parseInt(id) },
    data,
  });

  return Response.json(protocol);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.protocol.delete({ where: { id: parseInt(id) } });
  return Response.json({ ok: true });
}
