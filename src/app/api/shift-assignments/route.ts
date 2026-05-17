// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};
  if (date) where.date = date;
  if (userId) where.userId = parseInt(userId);
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = startDate;
    if (endDate) (where.date as Record<string, unknown>).lte = endDate;
  }

  const assignments = await prisma.shiftAssignment.findMany({
    where,
    include: { shift: true, user: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });

  return Response.json(assignments);
}

export async function POST(request: NextRequest) {
  const { shiftId, userId, date, role } = await request.json();

  const assignment = await prisma.shiftAssignment.create({
    data: { shiftId, userId, date, role: role || "ANOTADOR" },
    include: { shift: true, user: { select: { id: true, name: true } } },
  });

  return Response.json(assignment, { status: 201 });
}
