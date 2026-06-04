import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const VALID_STATUSES = ['draft', 'sent', 'accepted', 'refused']

// PUT /api/quotes/[id] - Update quote (notes, status, validUntil, discount)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyId = (session.user as { companyId: string }).companyId
    const { id } = await params
    const body = await request.json()
    const { notes, status, validUntil, discount } = body

    // Check ownership
    const existing = await db.quote.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Validate status
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (discount !== undefined) updateData.discount = discount

    const quote = await db.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { companyName: true, contactName: true } },
        commercial: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, reference: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: quote })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/quotes/[id] - Delete quote with ownership check
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyId = (session.user as { companyId: string }).companyId
    const { id } = await params

    // Check ownership
    const existing = await db.quote.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Delete quote items first, then quote
    await db.quoteItem.deleteMany({ where: { quoteId: id } })
    await db.quote.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
