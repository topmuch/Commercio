import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getCompanyId } from '@/lib/auth'
import { getAuthSession } from '@/lib/auth'

// ─── Validation constants ───
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

// POST /api/upload - Upload a file (auth + validation required)
export async function POST(request: NextRequest) {
  // 1. Authentication check
  const session = await getAuthSession()
  const companyId = await getCompanyId()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'posts'

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis.' },
        { status: 400 }
      )
    }

    // 2. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non supporté : ${file.type}. Types autorisés : images (JPEG, PNG, WebP, GIF), PDF, XLSX, DOCX.` },
        { status: 400 }
      )
    }

    // 3. Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum autorisé : 10 MB.` },
        { status: 400 }
      )
    }

    // 4. Validate file size > 0
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Le fichier est vide.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 5. Sanitize filename (prevent path traversal)
    const isImage = file.type.startsWith('image/')
    const fileType = isImage ? 'image' : 'document'

    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)

    // Organize uploads by company
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', companyId, type)

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    // Write the file
    const filePath = path.join(uploadDir, `${timestamp}-${safeName}`)
    await writeFile(filePath, buffer)

    // Build the public URL
    const fileUrl = `/uploads/${companyId}/${type}/${timestamp}-${safeName}`

    return NextResponse.json(
      {
        url: fileUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        type: fileType,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
