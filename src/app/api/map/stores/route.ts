import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const companyId = 'comp_1'

    // Get all clients with orders for revenue calculation
    const clients = await db.client.findMany({
      where: { companyId },
      include: {
        commercial: {
          select: { name: true },
        },
        _count: {
          select: { orders: true },
        },
        orders: {
          select: { total: true },
        },
      },
    })

    // Calculate revenue per client
    const clientsWithRevenue = clients.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      contactName: c.contactName,
      phone: c.phone,
      whatsapp: c.whatsapp,
      address: c.address,
      city: c.city,
      region: c.region,
      latitude: c.latitude,
      longitude: c.longitude,
      sector: c.sector,
      type: c.type,
      status: c.status,
      commercialName: c.commercial?.name,
      commercialId: c.commercialId,
      orderCount: c._count.orders,
      _revenue: Math.round(c.orders.reduce((sum, o) => sum + o.total, 0) * 100) / 100,
    }))

    // Group by region
    const regionMap = new Map<string, typeof clientsWithRevenue>()
    clientsWithRevenue.forEach((c) => {
      const region = c.region || 'Non défini'
      if (!regionMap.has(region)) regionMap.set(region, [])
      regionMap.get(region)!.push(c)
    })

    const regions = Array.from(regionMap.entries()).map(([name, stores]) => ({
      name,
      clientCount: stores.length,
      revenue: Math.round(stores.reduce((sum, s) => sum + s._revenue, 0) * 100) / 100,
      stores,
    }))

    // Group by type
    const typeMap = new Map<string, number>()
    clientsWithRevenue.forEach((c) => {
      typeMap.set(c.type, (typeMap.get(c.type) || 0) + 1)
    })

    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }))

    // Group by city
    const cityMap = new Map<string, number>()
    clientsWithRevenue.forEach((c) => {
      const city = c.city || 'Non défini'
      cityMap.set(city, (cityMap.get(city) || 0) + 1)
    })

    const cities = Array.from(cityMap.entries()).map(([name, count]) => ({ name, count }))

    // Get commercials for filter
    const commercials = await db.user.findMany({
      where: { role: 'commercial', companyId, active: true },
      select: { id: true, name: true },
    })

    return NextResponse.json({
      data: {
        clients: clientsWithRevenue,
        regions,
        byType,
        cities,
        commercials,
        totalClients: clientsWithRevenue.length,
        totalRevenue: Math.round(clientsWithRevenue.reduce((sum, c) => sum + c._revenue, 0) * 100) / 100,
      },
      count: clientsWithRevenue.length,
    })
  } catch (error: any) {
    console.error('Map Stores API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
