import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const COMPANY_ID = 'comp_1'

// GET /api/store-settings
export async function GET() {
  try {
    let settings = await db.storeSettings.findUnique({
      where: { companyId: COMPANY_ID },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await db.storeSettings.create({
        data: {
          companyId: COMPANY_ID,
          whatsappNumber: '+221770000000',
          storeTitle: 'Boutique DistribuSN',
          currency: 'CFA',
          isActive: true,
        },
      })
    }

    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch store settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/store-settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { whatsappNumber, storeTitle, currency, isActive } = body

    const settings = await db.storeSettings.upsert({
      where: { companyId: COMPANY_ID },
      create: {
        companyId: COMPANY_ID,
        whatsappNumber: whatsappNumber || '+221770000000',
        storeTitle: storeTitle || 'Boutique DistribuSN',
        currency: currency || 'CFA',
        isActive: isActive !== undefined ? isActive : true,
      },
      update: {
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(storeTitle !== undefined && { storeTitle }),
        ...(currency !== undefined && { currency }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update store settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
