import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join, extname } from 'path'

// Upload directory: same as upload route
function getUploadsDir(): string {
  return process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
}

// MIME types by extension
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
}

// Cache duration: 7 days for images
const CACHE_MAX_AGE = 60 * 60 * 24 * 7

// GET /api/uploads/[...path] — Serve uploaded files from /app/uploads/
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'Chemin manquant' }, { status: 400 })
    }

    // Prevent directory traversal attacks
    const relativePath = pathSegments.join('/')
    if (relativePath.includes('..') || relativePath.startsWith('/')) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 })
    }

    const filePath = join(getUploadsDir(), relativePath)

    // Check file exists and is within uploads directory
    const fileStat = await stat(filePath).catch(() => null)
    if (!fileStat || !fileStat.isFile()) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
    }

    // Read file
    const buffer = await readFile(filePath)
    const ext = extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}