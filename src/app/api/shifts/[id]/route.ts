// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, startTime, endTime, daysOfWeek } = await request.json();

  const shift = await prisma.shift.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(daysOfWeek !== undefined && { daysOfWeek }),
    },
  });

  return Response.json(shift);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.shift.delete({ where: { id: parseInt(id) } });
  return Response.json({ ok: true });
}
