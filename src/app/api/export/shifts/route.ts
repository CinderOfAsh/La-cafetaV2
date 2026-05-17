// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = {};
  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    where.date = { gte: start, lte: end };
  }

  const assignments = await prisma.shiftAssignment.findMany({
    where,
    include: {
      shift: true,
      user: true,
    },
    orderBy: { date: "asc" },
  });

  const rows = assignments.map((a) => ({
    Fecha: a.date,
    Turno: a.shift.name,
    HoraInicio: a.shift.startTime,
    HoraFin: a.shift.endTime,
    Empleado: a.user.name,
    Rol: a.role === "COCINERO" ? "Cocinero" : "Anotador",
  }));

  return Response.json(rows);
}
