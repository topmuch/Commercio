import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/clients/[id]/interactions - Create a new interaction
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

    const { type, content, direction, commercialId, latitude, longitude } = body

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Le type et le contenu sont requis.' },
        { status: 400 }
      )
    }

    // Check client exists
    const client = await db.client.findUnique({ where: { id, companyId } })
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé.' }, { status: 404 })
    }

    let interaction

    // Visit types (visit, field_visit) go to Visit model
    if (type === 'visit') {
      interaction = await db.visit.create({
        data: {
          type: 'visit',
          notes: content,
          status: 'completed',
          latitude: latitude || null,
          longitude: longitude || null,
          clientId: id,
          commercialId: commercialId || 'usr_1',
          companyId,
        },
        include: {
          commercial: { select: { name: true } },
        },
      })
      // Return in unified format
      return NextResponse.json({
        interaction: {
          id: interaction.id,
          type: 'visit',
          content: interaction.notes,
          direction: null,
          createdAt: interaction.createdAt,
          clientId: interaction.clientId,
          commercial: interaction.commercial,
          source: 'visit',
        },
      })
    }

    // All other types go to Discussion model
    interaction = await db.discussion.create({
      data: {
        type: type || 'note', // call, whatsapp, email, message, note
        content,
        direction: direction || 'outgoing',
        clientId: id,
        commercialId: commercialId || null,
        companyId,
      },
      include: {
        commercial: { select: { name: true } },
      },
    })

    return NextResponse.json({
      interaction: {
        id: interaction.id,
        type: interaction.type,
        content: interaction.content,
        direction: interaction.direction,
        createdAt: interaction.createdAt,
        clientId: interaction.clientId,
        commercial: interaction.commercial,
        source: 'discussion',
      },
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
