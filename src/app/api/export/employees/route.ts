// @ts-nocheck
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true, isActive: true, createdAt: true, customFields: true },
    orderBy: { name: "asc" },
  });

  const allKeys = new Set<string>();
  users.forEach((u) => {
    try {
      const cf = JSON.parse(u.customFields);
      if (typeof cf === "object" && cf !== null) Object.keys(cf).forEach((k) => allKeys.add(k));
    } catch {}
  });

  const rows = users.map((u) => {
    const row: Record<string, string> = {
      Nombre: u.name,
      Email: u.email,
      Rol: u.role === "ADMIN" ? "Administrador" : "Empleado",
      Activo: u.isActive ? "Sí" : "No",
      "Fecha Alta": u.createdAt.toISOString().slice(0, 10),
    };
    try {
      const cf = JSON.parse(u.customFields);
      if (typeof cf === "object" && cf !== null) {
        allKeys.forEach((k) => { row[`CF: ${k}`] = cf[k] ? String(cf[k]) : ""; });
      }
    } catch {}
    return row;
  });

  return Response.json(rows);
}
