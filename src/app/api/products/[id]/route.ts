import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/products/[id] - Get single product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, id: true } },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ data: product })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
