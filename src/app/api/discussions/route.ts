import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getCompanyId } from '@/lib/auth'

export async function GET() {
  try {
    const companyId = await getCompanyId()

    // Get all clients with their latest discussion
    const clients = await db.client.findMany({
      where: { companyId },
      include: {
        discussions: {
          orderBy: { createdAt: 'desc' },
        },
        commercial: {
          select: { name: true },
        },
        _count: {
          select: { discussions: true },
        },
      },
      orderBy: {
        discussions: {
          _count: 'desc',
        },
      },
    })

    // Get all discussions for all clients
    const allDiscussions = await db.discussion.findMany({
      where: { companyId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            type: true,
          },
        },
        commercial: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      data: {
        clients: clients.map((c) => ({
          id: c.id,
          companyName: c.companyName,
          contactName: c.contactName,
          phone: c.phone,
          whatsapp: c.whatsapp,
          type: c.type,
          status: c.status,
          city: c.city,
          region: c.region,
          commercialName: c.commercial?.name,
          discussionCount: c._count.discussions,
          lastMessage: c.discussions[0]?.content || null,
          lastMessageAt: c.discussions[0]?.createdAt || null,
          lastMessageType: c.discussions[0]?.type || null,
        })),
        discussions: allDiscussions,
      },
      count: clients.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
