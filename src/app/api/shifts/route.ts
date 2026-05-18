// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  if (date) {
    const assignments = await prisma.shiftAssignment.findMany({
      where: { date },
      include: { shift: true, user: { select: { id: true, name: true } } },
      orderBy: { shift: { name: "asc" } },
    });
    return Response.json(assignments);
  }

  const shifts = await prisma.shift.findMany({
    include: {
      assignments: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(shifts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.name !== undefined) {
    const shift = await prisma.shift.create({
      data: {
        name: body.name,
        startTime: body.startTime,
        endTime: body.endTime,
        daysOfWeek: body.daysOfWeek || "",
        openingProtocol: body.openingProtocol || "[]",
        closingProtocol: body.closingProtocol || "[]",
      },
    });
    return Response.json(shift, { status: 201 });
  }

  if (body.shiftId !== undefined && body.userId !== undefined) {
    const assignment = await prisma.shiftAssignment.create({
      data: {
        shiftId: body.shiftId,
        userId: body.userId,
        date: body.date,
        role: body.role || "ANOTADOR",
      },
      include: { shift: true, user: { select: { id: true, name: true } } },
    });
    return Response.json(assignment, { status: 201 });
  }

  return Response.json({ error: "Datos inválidos" }, { status: 400 });
}
