import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Upload directory: configurable via env, default to /app/uploads (or ./uploads in dev)
function getUploadsDir(): string {
  return process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// POST /api/upload — Upload a file to uploads/{folder}/
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'boutique'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Taille maximale: 5MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const randomString = crypto.randomBytes(8).toString('hex')
    const sanitizedName = sanitizeFilename(file.name || 'image')
    const ext = sanitizedName.split('.').pop() || 'jpg'
    const filename = `${Date.now()}-${randomString}.${ext}`

    // Upload to configurable directory (default: /app/uploads)
    const uploadsBase = getUploadsDir()
    const uploadDir = join(uploadsBase, folder)
    await mkdir(uploadDir, { recursive: true })

    // Read file buffer and write to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // URL served via /uploads/* rewrite → /api/uploads/* handler
    const url = `/uploads/${folder}/${filename}`

    return NextResponse.json({
      url,
      fileName: filename,
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du téléchargement'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}