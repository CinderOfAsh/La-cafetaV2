// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { completedBy, date } = await request.json();

  const completion = await prisma.protocolCompletion.create({
    data: {
      protocolId: parseInt(id),
      date: date || new Date().toISOString().slice(0, 10),
      completedBy: completedBy || null,
      completed: true,
    },
  });

  return Response.json(completion, { status: 201 });
}
