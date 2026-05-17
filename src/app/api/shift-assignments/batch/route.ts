// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { assignments } = await request.json();

  if (!Array.isArray(assignments)) {
    return Response.json({ error: "assignments debe ser un array" }, { status: 400 });
  }

  const created: { id: number; shiftId: number; userId: number; date: string; role: string }[] = [];
  const deleted: number[] = [];

  for (const item of assignments) {
    if (item.action === "delete" && item.id) {
      await prisma.shiftAssignment.delete({ where: { id: item.id } });
      deleted.push(item.id);
    } else if (item.action === "create") {
      const a = await prisma.shiftAssignment.create({
        data: {
          shiftId: item.shiftId,
          userId: item.userId,
          date: item.date,
          role: item.role || "ANOTADOR",
        },
      });
      created.push(a);
    }
  }

  return Response.json({ created, deleted }, { status: 200 });
}
