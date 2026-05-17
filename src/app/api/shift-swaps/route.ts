// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (userId) where.OR = [{ originalUserId: parseInt(userId) }, { replacementUserId: parseInt(userId) }];
  if (date) where.shiftAssignment = { date };

  const swaps = await prisma.shiftSwap.findMany({
    where,
    include: {
      originalUser: { select: { id: true, name: true } },
      replacementUser: { select: { id: true, name: true } },
      shiftAssignment: { include: { shift: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(swaps);
}

export async function POST(request: NextRequest) {
  const { originalUserId, replacementUserId, shiftAssignmentId, type } = await request.json();

  const swap = await prisma.shiftSwap.create({
    data: {
      originalUserId,
      replacementUserId,
      shiftAssignmentId,
      type,
    },
    include: {
      originalUser: { select: { id: true, name: true } },
      replacementUser: { select: { id: true, name: true } },
      shiftAssignment: { include: { shift: true } },
    },
  });

  if (type === "SUBSTITUTE") {
    await prisma.shiftDebt.create({
      data: {
        userId: replacementUserId,
        reason: `Sustitución de turno del ${swap.shiftAssignment.date}`,
        isPaid: false,
      },
    });
  }

  return Response.json(swap, { status: 201 });
}
