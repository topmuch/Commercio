import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/clients/[id]/notes - Get all notes for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
    const companyId = session.user.companyId

    const { id } = await params

    const notes = await db.clientNote.findMany({
      where: { clientId: id, companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        commercial: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ notes })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/clients/[id]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
    const companyId = session.user.companyId

    const { id } = await params
    const body = await request.json()

    const { content, commercialId } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Le contenu de la note est requis.' },
        { status: 400 }
      )
    }

    // Check client exists
    const client = await db.client.findUnique({ where: { id, companyId } })
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé.' }, { status: 404 })
    }

    const note = await db.clientNote.create({
      data: {
        content: content.trim(),
        clientId: id,
        commercialId: commercialId || null,
        companyId,
      },
      include: {
        commercial: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
