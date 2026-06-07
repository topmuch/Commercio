import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getCompanyId, getAuthSession } from '@/lib/auth'

// GET /api/store/banners — Admin: load all banners for current company (no slug = admin mode)
// GET /api/store/banners?slug=distribusn — Public endpoint (no auth required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // No slug = admin mode — load ALL banners for current company
    if (!slug) {
      const companyId = await getCompanyId()
      const banners = await db.storeBanner.findMany({
        where: { companyId },
        orderBy: { displayOrder: 'asc' },
      })
      return NextResponse.json({ data: banners })
    }

    // Public mode — load active banners by slug
    if (slug.length < 3) {
      return NextResponse.json(
        { error: 'Identifiant de boutique invalide' },
        { status: 400 }
      )
    }

    // Find store settings by slug
    const settings = await db.storeSettings.findUnique({
      where: { publicSlug: slug },
      select: {
        id: true,
        companyId: true,
        isActive: true,
      },
    })

    if (!settings || !settings.isActive) {
      return NextResponse.json(
        { error: 'Boutique introuvable ou désactivée' },
        { status: 404 }
      )
    }

    // Fetch active banners ordered by display order
    const banners = await db.storeBanner.findMany({
      where: {
        companyId: settings.companyId,
        isActive: true,
        startDate: { lte: new Date() },
      },
      select: {
        id: true,
        imageUrl: true,
        title: true,
        subtitle: true,
        linkUrl: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ data: banners })
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors du chargement des bannières'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/store/banners — Create a new banner (admin only)
export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId()
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const role = (session.user as { role: string }).role
    const adminRoles = ['admin', 'director', 'super_admin']
    if (!adminRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les administrateurs peuvent gérer les bannières.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { imageUrl, title, subtitle, linkUrl, displayOrder, isActive } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: "L'image de la bannière est requise" },
        { status: 400 }
      )
    }

    const banner = await db.storeBanner.create({
      data: {
        companyId,
        imageUrl,
        title: title || null,
        subtitle: subtitle || null,
        linkUrl: linkUrl || null,
        displayOrder: displayOrder ?? 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ data: banner }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/store/banners] Error:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de la bannière'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
