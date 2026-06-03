import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const companyId = 'comp_1'

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Previous month for growth comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)

    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const yesterdayEnd = todayStart

    // ─── Revenue today ───
    const todayOrders = await db.order.findMany({
      where: {
        companyId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      select: { total: true },
    })
    const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0)

    // Revenue yesterday for growth
    const yesterdayOrders = await db.order.findMany({
      where: {
        companyId,
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      select: { total: true },
    })
    const revenueYesterday = yesterdayOrders.reduce((sum, o) => sum + o.total, 0)

    // ─── Revenue this month ───
    const monthOrders = await db.order.findMany({
      where: {
        companyId,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      select: { total: true },
    })
    const revenueMonth = monthOrders.reduce((sum, o) => sum + o.total, 0)

    // Revenue prev month for growth
    const prevMonthOrders = await db.order.findMany({
      where: {
        companyId,
        createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
      },
      select: { total: true },
    })
    const revenuePrevMonth = prevMonthOrders.reduce((sum, o) => sum + o.total, 0)

    // ─── Counts ───
    const orderCount = await db.order.count({ where: { companyId } })
    const quoteCount = await db.quote.count({ where: { companyId } })
    const clientCount = await db.client.count({ where: { companyId } })

    // Orders last month for growth
    const prevMonthOrderCount = await db.order.count({
      where: {
        companyId,
        createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
      },
    })
    const currentMonthOrderCount = await db.order.count({
      where: {
        companyId,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    })

    // Clients added this month vs prev month for growth
    const prevMonthClientCount = await db.client.count({
      where: {
        companyId,
        createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
      },
    })
    const currentMonthClientCount = await db.client.count({
      where: {
        companyId,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    })

    // ─── Growth percentages ───
    const revenueTodayGrowth =
      revenueYesterday > 0
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
        : revenueToday > 0
          ? 100
          : 0

    const revenueMonthGrowth =
      revenuePrevMonth > 0
        ? ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100
        : revenueMonth > 0
          ? 100
          : 0

    const orderGrowth =
      prevMonthOrderCount > 0
        ? ((currentMonthOrderCount - prevMonthOrderCount) / prevMonthOrderCount) * 100
        : currentMonthOrderCount > 0
          ? 100
          : 0

    const clientGrowth =
      prevMonthClientCount > 0
        ? ((currentMonthClientCount - prevMonthClientCount) / prevMonthClientCount) * 100
        : currentMonthClientCount > 0
          ? 100
          : 0

    // ─── Top 5 products by sales ───
    const topProductsRaw = await db.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { companyId },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })

    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { name: true, reference: true, image: true },
        })
        return {
          id: item.productId,
          name: product?.name || 'Inconnu',
          reference: product?.reference || '',
          totalSold: item._sum.quantity || 0,
          revenue: item._sum.totalPrice || 0,
          image: product?.image || undefined,
        }
      })
    )

    // ─── Top 5 commercials by revenue ───
    const commercials = await db.user.findMany({
      where: { companyId, role: { in: ['commercial', 'admin'] } },
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: { select: { clients: true, orders: true } },
        targets: {
          where: { type: 'revenue' },
          select: { value: true, achieved: true, period: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    const topCommercials = await Promise.all(
      commercials.map(async (user) => {
        const commercialOrders = await db.order.findMany({
          where: { commercialId: user.id, companyId },
          select: { total: true },
        })
        const revenue = commercialOrders.reduce((sum, o) => sum + o.total, 0)
        const target = user.targets[0]
        const targetAchieved =
          target && target.value > 0 ? (target.achieved / target.value) * 100 : 0

        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar || undefined,
          revenue,
          clientCount: user._count.clients,
          orderCount: user._count.orders,
          targetAchieved: Math.min(targetAchieved, 100),
        }
      })
    )

    topCommercials.sort((a, b) => b.revenue - a.revenue)

    // ─── Revenue chart data (last 12 months) ───
    const revenueChartData: { name: string; value: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthOrdersData = await db.order.findMany({
        where: {
          companyId,
          createdAt: { gte: d, lt: mEnd },
        },
        select: { total: true },
      })
      const monthRevenue = monthOrdersData.reduce((sum, o) => sum + o.total, 0)
      const monthNames = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
      ]
      revenueChartData.push({
        name: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        value: Math.round(monthRevenue),
      })
    }

    // ─── Recent orders (last 5) ───
    const recentOrders = await db.order.findMany({
      where: { companyId },
      include: {
        client: { select: { companyName: true } },
        commercial: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentOrdersFormatted = recentOrders.map((order) => ({
      id: order.id,
      number: order.number,
      client: order.client.companyName,
      total: order.total,
      status: order.status,
      date: order.createdAt.toISOString(),
      commercial: order.commercial?.name,
    }))

    return NextResponse.json({
      revenueToday: Math.round(revenueToday),
      revenueMonth: Math.round(revenueMonth),
      orderCount,
      quoteCount,
      clientCount,
      revenueTodayGrowth: Math.round(revenueTodayGrowth * 10) / 10,
      revenueMonthGrowth: Math.round(revenueMonthGrowth * 10) / 10,
      orderGrowth: Math.round(orderGrowth * 10) / 10,
      clientGrowth: Math.round(clientGrowth * 10) / 10,
      topProducts,
      topCommercials: topCommercials.slice(0, 5),
      revenueChartData,
      recentOrders: recentOrdersFormatted,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
