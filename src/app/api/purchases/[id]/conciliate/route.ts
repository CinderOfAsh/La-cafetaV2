import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = '/home/z/my-project/public/uploads/invoices'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
const EXT_MAP: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// POST — upload invoice file and mark purchase as conciliated
// Multipart form-data with field "file"
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const purchase = await db.purchase.findUnique({ where: { id } })
    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se envió ningún archivo (campo "file")' }, { status: 400 })
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.type}. Solo PDF, JPEG, PNG, WEBP, GIF` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera 10MB' }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const ext = EXT_MAP[file.type] || 'bin'
    const fid = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    const filename = `invoice_${id}_${fid}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const invoiceUrl = `/uploads/invoices/${filename}`
    const conciliatedAt = new Date()

    const updated = await db.purchase.update({
      where: { id },
      data: { invoiceUrl, conciliatedAt },
      include: { items: { include: { rawMaterial: true } } },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
