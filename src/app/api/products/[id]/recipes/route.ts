import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list product recipes with rawMaterial included
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const recipes = await db.productRecipe.findMany({
      where: { productId: id },
      include: { rawMaterial: true },
    })
    return NextResponse.json({ data: recipes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — add recipe ingredient (upsert by productId+rawMaterialId)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { rawMaterialId, quantity } = body

    if (!rawMaterialId || quantity === undefined) {
      return NextResponse.json({ error: 'Faltan: rawMaterialId, quantity' }, { status: 400 })
    }

    const recipe = await db.productRecipe.upsert({
      where: {
        productId_rawMaterialId: { productId: id, rawMaterialId },
      },
      update: { quantity: Number(quantity) },
      create: {
        productId: id,
        rawMaterialId,
        quantity: Number(quantity),
      },
      include: { rawMaterial: true },
    })

    return NextResponse.json({ data: recipe })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT — update recipe quantity
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { rawMaterialId, quantity } = body

    if (!rawMaterialId || quantity === undefined) {
      return NextResponse.json({ error: 'Faltan: rawMaterialId, quantity' }, { status: 400 })
    }

    const recipe = await db.productRecipe.update({
      where: {
        productId_rawMaterialId: { productId: id, rawMaterialId },
      },
      data: { quantity: Number(quantity) },
      include: { rawMaterial: true },
    })

    return NextResponse.json({ data: recipe })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
