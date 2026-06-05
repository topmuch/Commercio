import { db } from '@/lib/db'
import { getCompanyId } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const ai = new ZAI()

export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()
    const { message, history = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 })
    }

    // ─── Fetch company context ───
    const [
      clientsCount,
      totalRevenueResult,
      topProductsRaw,
      topCommercials,
      recentOrders,
      stockAlerts,
    ] = await Promise.all([
      db.client.count({ where: { companyId } }),
      db.order.aggregate({ _sum: { total: true }, where: { companyId } }),
      db.orderItem.groupBy({
        by: ['productId'],
        where: { order: { companyId } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      db.user.findMany({
        where: { companyId, role: { in: ['commercial', 'admin'] } },
        select: { name: true },
        take: 5,
      }),
      db.order.findMany({
        where: { companyId },
        include: {
          client: { select: { companyName: true } },
          commercial: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.product.findMany({
        where: { companyId, stock: { lte: 5 } },
        select: { name: true, stock: true, minStock: true },
        take: 10,
      }),
    ])

    // Resolve top product names
    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })
        return {
          name: product?.name || 'Inconnu',
          quantity: item._sum.quantity || 0,
          revenue: Math.round(item._sum.totalPrice || 0),
        }
      })
    )

    const totalRevenue = totalRevenueResult._sum.total || 0

    // ─── Build French system prompt ───
    const systemPrompt = `Tu es un assistant IA intelligent pour DistribuERP, un logiciel ERP de distribution au Sénégal. Tu parles français et tu aides l'utilisateur à analyser ses données commerciales, optimiser sa gestion, et prendre de meilleures décisions.

Contexte de l'entreprise :
- Nombre de clients : ${clientsCount}
- Chiffre d'affaires total : ${Math.round(totalRevenue)} FCFA
- Produits les plus vendus : ${topProducts.map((p) => `${p.name} (${p.quantity} unités, ${p.revenue} FCFA)`).join(', ') || 'Aucun'}
- Commerciaux : ${topCommercials.map((c) => c.name).join(', ') || 'Aucun'}
- Alertes stock (stock ≤ 5) : ${stockAlerts.map((s) => `${s.name} (stock: ${s.stock}, min: ${s.minStock})`).join(', ') || 'Aucune alerte'}
- Commandes récentes : ${recentOrders.map((o) => `${o.number} - ${o.client.companyName} - ${Math.round(o.total)} FCFA (${o.commercial?.name || 'N/A'})`).join('; ') || 'Aucune'}

Règles :
- Réponds toujours en français
- Utilise les montants en FCFA
- Sois concis et précis
- Propose des actions concrètes quand pertinent
- Si tu n'as pas assez de données, dis-le honnêtement
- Formatte les chiffres avec séparateurs de milliers (ex: 1 500 000 FCFA)
`

    // ─── Call LLM ───
    const completion = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
    })

    const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.'

    return NextResponse.json({ response })
  } catch (error: unknown) {
    console.error('AI API error:', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
