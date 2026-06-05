import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCompanyId } from '@/lib/auth'

// GET /api/orders?status=new&search=&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const where: Record<string, unknown> = { companyId }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { client: { companyName: { contains: search } } },
        { client: { contactName: { contains: search } } },
        { commercial: { name: { contains: search } } },
      ]
    }

    const [orders, total, statusCountsResult] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          client: { select: { companyName: true, contactName: true } },
          commercial: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
      // Status counts for ALL orders
      db.order.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { status: true },
      }),
    ])

    const statusCounts = Object.fromEntries(
      statusCountsResult.map((r) => [r.status, r._count.status])
    )
    statusCounts['all'] = await db.order.count({ where: { companyId } })

    return NextResponse.json({
      data: orders,
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/orders — Create order with items
export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const {
      clientId,
      commercialId,
      items,
      discount = 0,
      tax = 18,
      notes,
    } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Le client est requis' }, { status: 400 })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Au moins un article est requis' }, { status: 400 })
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Chaque article doit avoir un produit, une quantité et un prix unitaire' },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )
    const discountAmount = (subtotal * discount) / 100
    const taxAmount = ((subtotal - discountAmount) * tax) / 100
    const total = subtotal - discountAmount + taxAmount

    // Generate order number
    const count = await db.order.count({ where: { companyId } })
    const number = `CMD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    const order = await db.order.create({
      data: {
        number,
        status: 'new',
        total,
        discount,
        tax: taxAmount,
        notes,
        clientId,
        commercialId,
        companyId,
        items: {
          create: items.map(
            (item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })
          ),
        },
      },
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

    // Decrement stock for each ordered product
    await Promise.all(
      items.map((item: { productId: string; quantity: number }) =>
        db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    )

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
