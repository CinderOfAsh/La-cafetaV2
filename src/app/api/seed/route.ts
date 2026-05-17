// @ts-nocheck
import { prisma } from "@/lib/prisma";
import data from "@/lib/seed-data.json";

export async function POST() {
  try {
    const existing = await prisma.product.count();
    if (existing > 0) {
      return Response.json({ message: "Datos ya existen", products: existing });
    }

    const seed = data;

    for (const s of (seed.Shift || [])) {
      await prisma.shift.upsert({
        where: { id: s.id },
        update: { name: s.name, startTime: s.startTime, endTime: s.endTime },
        create: { id: s.id, name: s.name, startTime: s.startTime, endTime: s.endTime },
      });
    }

    for (const p of (seed.Product || [])) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: { name: p.name, price: p.price, tags: p.tags, imageUrl: p.imageUrl || "", description: p.description || "", isActive: p.isActive ?? true, customFields: p.customFields || "{}" },
        create: { id: p.id, name: p.name, price: p.price, tags: p.tags, imageUrl: p.imageUrl || "", description: p.description || "", isActive: p.isActive ?? true, customFields: p.customFields || "{}" },
      });
    }

    for (const inv of (seed.Inventory || [])) {
      await prisma.inventory.upsert({
        where: { id: inv.id },
        update: { stock: inv.stock, minStock: inv.minStock, unit: inv.unit || "unidad", customFields: inv.customFields || "{}" },
        create: { id: inv.id, productId: inv.productId, stock: inv.stock, minStock: inv.minStock, unit: inv.unit || "unidad", customFields: inv.customFields || "{}" },
      });
    }

    return Response.json({ message: "Base de datos inicializada", products: seed.Product?.length || 0 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
