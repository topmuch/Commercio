import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getCompanyId } from '@/lib/auth'

// GET /api/store-settings
export async function GET() {
  try {
    const companyId = await getCompanyId()

    let settings = await db.storeSettings.findUnique({
      where: { companyId },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await db.storeSettings.create({
        data: {
          companyId,
          whatsappNumber: '+221770000000',
          storeTitle: 'Boutique DistribuSN',
          currency: 'CFA',
          isActive: true,
        },
      })
    }

    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des paramètres'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/store-settings
export async function PUT(request: Request) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const { whatsappNumber, storeTitle, currency, isActive } = body

    const settings = await db.storeSettings.upsert({
      where: { companyId },
      create: {
        companyId,
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
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des paramètres'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
