import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const COMPANY_ID = 'comp_1'

// GET /api/categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { companyId: COMPANY_ID },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: categories })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
