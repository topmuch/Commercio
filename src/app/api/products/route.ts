import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const COMPANY_ID = 'comp_1'

// GET /api/products?search=...&category=...&status=...&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      companyId: COMPANY_ID,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { reference: { contains: search } },
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (status) {
      where.status = status
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      reference,
      description,
      price,
      resellerPrice,
      image,
      categoryId,
      brand,
      minStock,
      status,
    } = body

    if (!name || !reference || price === undefined) {
      return NextResponse.json(
        { error: 'Name, reference, and price are required' },
        { status: 400 }
      )
    }

    // Check unique reference
    const existing = await db.product.findUnique({
      where: { reference },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'A product with this reference already exists' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        reference,
        description,
        price: parseFloat(price),
        resellerPrice: resellerPrice ? parseFloat(resellerPrice) : null,
        image: image || null,
        categoryId: categoryId || null,
        brand: brand || null,
        stock: 0,
        minStock: minStock ? parseInt(minStock) : 5,
        status: status || 'active',
        companyId: COMPANY_ID,
      },
      include: {
        category: { select: { name: true } },
      },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/products - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check unique reference if being updated
    if (updateData.reference) {
      const existing = await db.product.findFirst({
        where: {
          reference: updateData.reference,
          id: { not: id },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'A product with this reference already exists' },
          { status: 400 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (updateData.name !== undefined) data.name = updateData.name
    if (updateData.reference !== undefined) data.reference = updateData.reference
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.price !== undefined) data.price = parseFloat(updateData.price)
    if (updateData.resellerPrice !== undefined)
      data.resellerPrice = updateData.resellerPrice ? parseFloat(updateData.resellerPrice) : null
    if (updateData.image !== undefined) data.image = updateData.image || null
    if (updateData.categoryId !== undefined) data.categoryId = updateData.categoryId || null
    if (updateData.brand !== undefined) data.brand = updateData.brand || null
    if (updateData.minStock !== undefined) data.minStock = parseInt(updateData.minStock)
    if (updateData.status !== undefined) data.status = updateData.status

    const product = await db.product.update({
      where: { id },
      data,
      include: {
        category: { select: { name: true } },
      },
    })

    return NextResponse.json({ data: product })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
