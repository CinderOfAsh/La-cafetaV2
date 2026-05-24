// @ts-nocheck
import { prisma } from "@/lib/prisma";

let seedData: any = null;
try { seedData = require("@/lib/seed-data.json"); } catch {}

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    if (!seedData) {
      return Response.json({ error: "No hay datos de semilla" }, { status: 500 });
    }

    const existing = await prisma.product.count();
    if (existing > 0) {
      return Response.json({ message: "Datos ya existen", products: existing });
    }

    const seed = seedData;

    for (const s of (seed.Shift || [])) {
      await prisma.shift.upsert({
        where: { id: s.id },
        update: { name: s.name, startTime: s.startTime, endTime: s.endTime },
        create: { id: s.id, name: s.name, startTime: s.startTime, endTime: s.endTime, daysOfWeek: "" },
      });
    }

    for (const p of (seed.Product || [])) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: { id: p.id, name: p.name, price: p.price, tags: p.tags, imageUrl: p.imageUrl || "", description: p.description || "", isActive: true, customFields: p.customFields || "{}" },
      });
    }

    for (const inv of (seed.Inventory || [])) {
      await prisma.inventory.upsert({
        where: { id: inv.id },
        update: {},
        create: {
          id: inv.id,
          name: inv.name || "",
          productId: inv.productId || null,
          stock: inv.stock ?? 0,
          minStock: inv.minStock ?? 5,
          unit: inv.unit || "unidad",
          customFields: inv.customFields || "{}",
        },
      });
    }

    for (const pi of (seed.ProductIngredient || [])) {
      await prisma.productIngredient.create({
        data: {
          productId: pi.productId,
          inventoryId: pi.inventoryId,
          quantity: pi.quantity ?? 1,
          unit: pi.unit || "unidad",
        },
      });
    }

    return Response.json({
      message: "Base de datos inicializada",
      products: seed.Product?.length || 0,
      inventory: seed.Inventory?.length || 0,
      ingredients: seed.ProductIngredient?.length || 0,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
