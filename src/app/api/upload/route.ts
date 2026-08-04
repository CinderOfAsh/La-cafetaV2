import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = '/home/z/my-project/public/uploads'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// POST — multipart/form-data with field "file"; returns { url }
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se envió ningún archivo (campo "file")' }, { status: 400 })
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.type}. Solo jpeg/png/webp/gif` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera 5MB' }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const ext = EXT_MAP[file.type] || 'bin'
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    const filename = `${id}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
