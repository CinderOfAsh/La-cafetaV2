import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseProduct(p: any) {
  return {
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    customFields: JSON.parse(p.customFields || '{}'),
    recipes: (p.recipes || []).map((r: any) => ({
      ...r,
      rawMaterial: r.rawMaterial
        ? {
            ...r.rawMaterial,
            critical: r.rawMaterial.stock < r.rawMaterial.minStock,
          }
        : r.rawMaterial,
    })),
  }
}

// GET — list all products (optionally filter active=true), includes recipes + rawMaterial + protocol
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')

    const products = await db.product.findMany({
      where: active === 'true' ? { isActive: true } : active === 'false' ? { isActive: false } : undefined,
      include: {
        recipes: { include: { rawMaterial: true } },
        protocol: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: products.map(parseProduct) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create product with optional embedded recipes
// Body: { name, price, tags?, imageUrl?, description?, isActive?, customFields?, recipes?: [{rawMaterialId, quantity}] }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, price, tags, imageUrl, description, isActive, customFields, recipes } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos: name, price' }, { status: 400 })
    }

    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          price: Number(price),
          tags: JSON.stringify(tags || []),
          imageUrl: imageUrl || null,
          description: description || null,
          isActive: isActive ?? true,
          customFields: JSON.stringify(customFields || {}),
          recipes: recipes && Array.isArray(recipes) && recipes.length > 0
            ? {
                create: recipes
                  .filter((r: any) => r.rawMaterialId && r.quantity !== undefined)
                  .map((r: any) => ({
                    rawMaterialId: r.rawMaterialId,
                    quantity: Number(r.quantity),
                  })),
              }
            : undefined,
        },
        include: { recipes: { include: { rawMaterial: true } }, protocol: true },
      })
      return created
    })

    return NextResponse.json({ data: parseProduct(product) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
