// @ts-nocheck
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { inventory: true },
    orderBy: { name: "asc" },
  });

  const allKeys = new Set<string>();
  products.forEach((p) => {
    try {
      const cf = JSON.parse(p.customFields);
      if (typeof cf === "object" && cf !== null) Object.keys(cf).forEach((k) => allKeys.add(k));
    } catch {}
  });

  const rows = products.map((p) => {
    const row: Record<string, string | number | boolean> = {
      Nombre: p.name,
      Precio: p.price,
      Tags: p.tags,
      Descripcion: p.description,
      Activo: p.isActive ? "Sí" : "No",
      Stock: p.inventory?.stock ?? 0,
      StockMinimo: p.inventory?.minStock ?? 0,
      Unidad: p.inventory?.unit ?? "unidad",
    };
    try {
      const cf = JSON.parse(p.customFields);
      if (typeof cf === "object" && cf !== null) {
        allKeys.forEach((k) => { row[`CF: ${k}`] = cf[k] ? String(cf[k]) : ""; });
      }
    } catch {}
    return row;
  });

  return Response.json(rows);
}
