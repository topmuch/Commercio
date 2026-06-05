import { db } from '@/lib/db'
import { getCompanyId } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const VALID_STATUSES = ['new', 'validated', 'preparation', 'shipped', 'delivered']

// PUT /api/orders/[id] - Update order notes and/or status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params
    const body = await request.json()
    const { notes, status } = body

    // Check ownership
    const existing = await db.order.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
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

    const order = await db.order.update({
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

    return NextResponse.json({ data: order })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/orders/[id] - Delete order (with ownership check)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

    // Check ownership
    const existing = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Delete order items first, then order
    await db.orderItem.deleteMany({ where: { orderId: id } })
    await db.order.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
