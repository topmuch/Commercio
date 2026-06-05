import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getCompanyId } from '@/lib/auth'

export async function GET() {
  try {
    const companyId = await getCompanyId()

    // Fetch all commercials with counts and targets
    const commercials = await db.user.findMany({
      where: {
        role: 'commercial',
        companyId,
        active: true,
      },
      include: {
        _count: {
          select: {
            clients: true,
            orders: true,
            visits: true,
          },
        },
        targets: {
          where: {
            type: 'revenue',
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Batched revenue query — no N+1
    const commercialIds = commercials.map((c) => c.id)
    const commercialRevenues = commercialIds.length > 0
      ? await db.order.groupBy({
          by: ['commercialId'],
          where: { commercialId: { in: commercialIds }, companyId },
          _sum: { total: true },
        })
      : []
    const revenueMap = new Map(
      commercialRevenues.map((r) => [r.commercialId, r._sum.total || 0])
    )

    const commercialsWithRevenue = commercials.map((c) => {
      const _revenue = revenueMap.get(c.id) || 0

      // Get the revenue target
      const revenueTarget = c.targets.find((t) => t.type === 'revenue')
      const targetValue = revenueTarget?.value || 0
      const targetAchieved = revenueTarget?.achieved || 0
      const _targetPercent = targetValue > 0 ? Math.round((targetAchieved / targetValue) * 100) : 0

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar,
        role: c.role,
        active: c.active,
        _count: c._count,
        targets: c.targets,
        _revenue: Math.round(_revenue * 100) / 100,
        _targetPercent,
      }
    })

    // Sort by revenue descending
    commercialsWithRevenue.sort((a, b) => b._revenue - a._revenue)

    return NextResponse.json({ data: commercialsWithRevenue, count: commercialsWithRevenue.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
