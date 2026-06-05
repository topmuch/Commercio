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
    const { whatsappNumber, storeTitle, storeDescription, currency, isActive, publicSlug } = body

    // Validate slug format
    if (publicSlug !== undefined && publicSlug !== null && publicSlug !== '') {
      const slug = String(publicSlug).trim()
      if (slug.length < 3) {
        return NextResponse.json(
          { error: "L'identifiant doit contenir au moins 3 caractères" },
          { status: 400 }
        )
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return NextResponse.json(
          { error: "L'identifiant ne peut contenir que des lettres, chiffres, tirets et underscores" },
          { status: 400 }
        )
      }
      // Check uniqueness (publicSlug is @unique in schema)
      try {
        const existing = await db.storeSettings.findFirst({
          where: {
            publicSlug: slug,
            NOT: { companyId },
          },
        })
        if (existing) {
          return NextResponse.json(
            { error: 'Cet identifiant est déjà utilisé par une autre boutique' },
            { status: 409 }
          )
        }
      } catch {
        // Ignore uniqueness check errors, let upsert handle it
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber
    if (storeTitle !== undefined) updateData.storeTitle = storeTitle
    if (storeDescription !== undefined) updateData.storeDescription = storeDescription
    if (currency !== undefined) updateData.currency = currency
    if (isActive !== undefined) updateData.isActive = isActive
    if (publicSlug !== undefined) updateData.publicSlug = publicSlug || null

    const settings = await db.storeSettings.upsert({
      where: { companyId },
      create: {
        companyId,
        whatsappNumber: String(whatsappNumber || '+221770000000'),
        storeTitle: String(storeTitle || 'Boutique DistribuSN'),
        storeDescription: storeDescription ? String(storeDescription) : null,
        currency: String(currency || 'CFA'),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        publicSlug: publicSlug ? String(publicSlug) : null,
      },
      update: updateData,
    })

    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des paramètres'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
