import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCompanyId } from '@/lib/auth'

// GET /api/stock?productId=...&type=...&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      companyId,
    }

    if (productId) {
      where.productId = productId
    }

    if (type) {
      where.type = type
    }

    const [movements, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { name: true, reference: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      data: movements,
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des mouvements'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/stock - Create stock movement
export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const { productId, type, quantity, reason } = body

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'Produit, type et quantité requis' },
        { status: 400 }
      )
    }

    if (!['entry', 'exit', 'adjustment'].includes(type)) {
      return NextResponse.json(
        { error: 'Le type doit être entrée, sortie ou ajustement' },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const qty = parseInt(quantity)

    // Update product stock
    let newStock = product.stock
    if (type === 'entry') {
      newStock = product.stock + qty
    } else if (type === 'exit') {
      newStock = Math.max(0, product.stock - qty)
    } else if (type === 'adjustment') {
      newStock = Math.max(0, product.stock + qty)
    }

    await db.product.update({
      where: { id: productId },
      data: { stock: newStock },
    })

    const movement = await db.stockMovement.create({
      data: {
        type,
        quantity: qty,
        reason: reason || null,
        productId,
        companyId,
      },
      include: {
        product: {
          select: { name: true, reference: true },
        },
      },
    })

    return NextResponse.json({ data: movement }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du mouvement'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
