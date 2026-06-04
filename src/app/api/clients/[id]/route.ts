import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients/[id] - Get a single client with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = 'comp_1'

    const client = await db.client.findUnique({
      where: { id, companyId },
      include: {
        commercial: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            commercial: {
              select: { name: true },
            },
          },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            commercial: {
              select: { name: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            commercial: {
              select: { name: true },
            },
          },
        },
        visits: {
          orderBy: { createdAt: 'desc' },
          include: {
            commercial: {
              select: { name: true },
            },
          },
        },
        discussions: {
          orderBy: { createdAt: 'desc' },
          include: {
            commercial: {
              select: { name: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé.' }, { status: 404 })
    }

    // Calculate totals
    const totalRevenue = client.invoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalPaid = client.invoices.reduce((sum, inv) => sum + inv.paid, 0)
    const totalOrdersRevenue = client.orders.reduce((sum, ord) => sum + ord.total, 0)
    const totalQuotesValue = client.quotes.reduce((sum, q) => sum + q.total, 0)
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      client: {
        ...client,
        stats: {
          totalRevenue,
          totalPaid,
          totalOrdersRevenue,
          totalQuotesValue,
          totalPayments,
          ordersCount: client.orders.length,
          quotesCount: client.quotes.length,
          invoicesCount: client.invoices.length,
          visitsCount: client.visits.length,
          discussionsCount: client.discussions.length,
          paymentsCount: client.payments.length,
        },
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update client notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const companyId = 'comp_1'

    const { notes } = body

    const client = await db.client.update({
      where: { id, companyId },
      data: { notes },
      include: {
        commercial: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({ client })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
