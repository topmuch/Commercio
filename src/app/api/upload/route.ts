import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine file type from mimeType
    const mimeType = file.type
    const isImage = mimeType.startsWith('image/')
    const fileType = isImage ? 'image' : 'document'

    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}-${safeName}`

    // Build the upload directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type)

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    // Write the file
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Build the public URL
    const fileUrl = `/uploads/${type}/${fileName}`

    return NextResponse.json(
      {
        url: fileUrl,
        fileName: file.name,
        mimeType,
        fileSize: file.size,
        type: fileType,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
