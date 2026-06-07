import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/whatsapp-orders — Public endpoint (no auth required)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, clientName, clientPhone, items, totalAmount } = body

    if (!slug || !clientName || !clientPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Données de commande manquantes' },
        { status: 400 }
      )
    }

    // Find store settings by slug to get companyId
    const settings = await db.storeSettings.findUnique({
      where: { publicSlug: slug },
      select: { id: true, companyId: true, isActive: true },
    })

    if (!settings || !settings.isActive) {
      return NextResponse.json(
        { error: 'Boutique introuvable ou désactivée' },
        { status: 404 }
      )
    }

    // Save the order
    const order = await db.whatsappOrder.create({
      data: {
        companyId: settings.companyId,
        clientName,
        clientPhone,
        items: JSON.stringify(items),
        totalAmount: parseFloat(totalAmount) || 0,
        status: 'en_attente_validation',
      },
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de l'enregistrement de la commande"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
