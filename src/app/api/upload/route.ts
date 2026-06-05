import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getToken } from 'next-auth/jwt'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // SVG removed — can contain malicious scripts (stored XSS)
]

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = await getToken({
      req: request as unknown as Parameters<typeof getToken>[0],
      secret: process.env.NEXTAUTH_SECRET,
    })
    // In demo mode (no NEXTAUTH_SECRET), allow upload
    if (!token && process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'general' // logos, seo, general

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 5 Mo)' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${randomStr}.${ext}`

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', type)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file
    const filePath = join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, new Uint8Array(bytes))

    // Return public URL path
    const publicPath = `/uploads/${type}/${filename}`

    return NextResponse.json({
      data: {
        url: publicPath,
        filename,
        size: file.size,
        mimeType: file.type,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'upload"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
