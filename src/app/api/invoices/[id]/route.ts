import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/invoices/[id] - Update invoice notes
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
    const { notes } = body

    // Check ownership
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: { notes },
      include: {
        client: { select: { companyName: true, contactName: true } },
        commercial: { select: { name: true } },
        payments: {
          select: { id: true, amount: true, method: true, reference: true, createdAt: true },
        },
      },
    })

    return NextResponse.json({ data: invoice })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Delete invoice with ownership check
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
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Delete associated payments first
    await db.payment.deleteMany({ where: { invoiceId: id } })

    // Delete invoice items, then invoice
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
    await db.invoice.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
