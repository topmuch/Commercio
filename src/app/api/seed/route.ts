import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const companyId = 'comp_1'

    // Check if data already exists
    const existingClients = await db.client.count({ where: { companyId } })
    if (existingClients > 0) {
      return NextResponse.json({ message: 'Data already seeded', count: existingClients })
    }

    // Create Company
    await db.company.upsert({
      where: { email: 'contact@distribuerp.com' },
      update: {},
      create: {
        id: companyId,
        name: 'DistribuERP Demo',
        email: 'contact@distribuerp.com',
        phone: '+213 555 000 001',
        address: '123 Rue Principale, Alger',
        plan: 'enterprise',
      },
    })

    // Create Users
    const users = await Promise.all([
      db.user.create({
        data: {
          id: 'usr_1', email: 'ahmed@distribuerp.com', password: 'hashed', name: 'Ahmed Benali',
          phone: '+213 555 000 010', role: 'admin', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_2', email: 'fatima@distribuerp.com', password: 'hashed', name: 'Fatima Zahra',
          phone: '+213 555 000 011', role: 'commercial', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_3', email: 'karim@distribuerp.com', password: 'hashed', name: 'Karim Meziane',
          phone: '+213 555 000 012', role: 'commercial', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_4', email: 'amina@distribuerp.com', password: 'hashed', name: 'Amina Khelifi',
          phone: '+213 555 000 013', role: 'commercial', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_5', email: 'youcef@distribuerp.com', password: 'hashed', name: 'Youcef Benmoussa',
          phone: '+213 555 000 014', role: 'accountant', companyId,
        },
      }),
    ])

    // Create Categories
    const categories = await Promise.all([
      db.category.create({ data: { id: 'cat_1', name: 'Boissons', companyId } }),
      db.category.create({ data: { id: 'cat_2', name: 'Alimentation', companyId } }),
      db.category.create({ data: { id: 'cat_3', name: 'Produits d\'entretien', companyId } }),
      db.category.create({ data: { id: 'cat_4', name: 'Cosmétiques', companyId } }),
      db.category.create({ data: { id: 'cat_5', name: 'Confiserie', parentId: 'cat_2', companyId } }),
      db.category.create({ data: { id: 'cat_6', name: 'Produits laitiers', parentId: 'cat_2', companyId } }),
      db.category.create({ data: { id: 'cat_7', name: 'Jus & Sodas', parentId: 'cat_1', companyId } }),
      db.category.create({ data: { id: 'cat_8', name: 'Eau minérale', parentId: 'cat_1', companyId } }),
    ])

    // Create Products
    const products = await Promise.all([
      db.product.create({ data: { id: 'prod_1', name: 'Coca-Cola 33cl', reference: 'BOI-001', price: 120, resellerPrice: 95, stock: 500, minStock: 50, categoryId: 'cat_7', brand: 'Coca-Cola', companyId } }),
      db.product.create({ data: { id: 'prod_2', name: 'Ifri Orangina 25cl', reference: 'BOI-002', price: 90, resellerPrice: 72, stock: 350, minStock: 40, categoryId: 'cat_7', brand: 'Ifri', companyId } }),
      db.product.create({ data: { id: 'prod_3', name: 'Sémoule Extra 5kg', reference: 'ALI-001', price: 450, resellerPrice: 380, stock: 200, minStock: 20, categoryId: 'cat_2', brand: 'Amor Benali', companyId } }),
      db.product.create({ data: { id: 'prod_4', name: 'Huile de cuisine 5L', reference: 'ALI-002', price: 1200, resellerPrice: 1050, stock: 150, minStock: 15, categoryId: 'cat_2', brand: 'Safia', companyId } }),
      db.product.create({ data: { id: 'prod_5', name: 'Lait UHT 1L', reference: 'ALI-003', price: 85, resellerPrice: 70, stock: 800, minStock: 100, categoryId: 'cat_6', brand: 'Tounsi', companyId } }),
      db.product.create({ data: { id: 'prod_6', name: 'Détergent洗衣液 2L', reference: 'ENT-001', price: 380, resellerPrice: 320, stock: 120, minStock: 20, categoryId: 'cat_3', brand: 'Axion', companyId } }),
      db.product.create({ data: { id: 'prod_7', name: 'Savon de Marseille 400g', reference: 'ENT-002', price: 150, resellerPrice: 120, stock: 300, minStock: 30, categoryId: 'cat_3', brand: 'Marseille', companyId } }),
      db.product.create({ data: { id: 'prod_8', name: 'Shampooing 400ml', reference: 'COS-001', price: 350, resellerPrice: 290, stock: 180, minStock: 25, categoryId: 'cat_4', brand: 'Dove', companyId } }),
      db.product.create({ data: { id: 'prod_9', name: 'Eau minérale Saidal 1.5L', reference: 'BOI-003', price: 55, resellerPrice: 42, stock: 1200, minStock: 150, categoryId: 'cat_8', brand: 'Saidal', companyId } }),
      db.product.create({ data: { id: 'prod_10', name: 'Café moulu 250g', reference: 'ALI-004', price: 420, resellerPrice: 360, stock: 250, minStock: 30, categoryId: 'cat_2', brand: 'Bonal', companyId } }),
      db.product.create({ data: { id: 'prod_11', name: 'Biscuit Festival 150g', reference: 'CON-001', price: 95, resellerPrice: 75, stock: 3, minStock: 50, categoryId: 'cat_5', brand: 'Festival', companyId } }),
      db.product.create({ data: { id: 'prod_12', name: 'Thé à la menthe 100 sachets', reference: 'ALI-005', price: 280, resellerPrice: 230, stock: 0, minStock: 40, categoryId: 'cat_2', brand: 'Assad', companyId } }),
    ])

    // Create Clients
    const clients = await Promise.all([
      db.client.create({ data: { id: 'cli_1', companyName: 'Supermarché Central', contactName: 'Mohamed Tayeb', phone: '+213 555 100 001', whatsapp: '+213 555 100 001', email: 'central@email.com', address: 'Avenue de l\'ALN, Alger', city: 'Alger', region: 'Alger', latitude: 36.7538, longitude: 3.0588, type: 'supermarche', status: 'active', sector: 'Grande distribution', commercialId: 'usr_2', companyId } }),
      db.client.create({ data: { id: 'cli_2', companyName: 'Boutique El Feth', contactName: 'Samira Bouzid', phone: '+213 555 100 002', whatsapp: '+213 555 100 002', address: 'Rue Didouche Mourad, Oran', city: 'Oran', region: 'Oran', latitude: 35.6978, longitude: -0.6331, type: 'boutique', status: 'active', sector: 'Alimentation', commercialId: 'usr_2', companyId } }),
      db.client.create({ data: { id: 'cli_3', companyName: 'Grossiste Hamidi', contactName: 'Rachid Hamidi', phone: '+213 555 100 003', whatsapp: '+213 555 100 003', email: 'hamidi@email.com', address: 'Zone Industrielle, Constantine', city: 'Constantine', region: 'Constantine', latitude: 36.3650, longitude: 6.6147, type: 'grossiste', status: 'active', sector: 'Gros', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_4', companyName: 'Mini Market Baba', contactName: 'Ali Baba', phone: '+213 555 100 004', address: 'Cité 1000 Logements, Blida', city: 'Blida', region: 'Blida', latitude: 36.4781, longitude: 2.8306, type: 'boutique', status: 'active', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_5', companyName: 'Revendeur Medea Plus', contactName: 'Nadia Medea', phone: '+213 555 100 005', whatsapp: '+213 555 100 005', email: 'medea@email.com', address: 'Centre ville, Médéa', city: 'Médéa', region: 'Médéa', latitude: 36.2645, longitude: 2.7467, type: 'revendeur', status: 'active', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_6', companyName: 'Superette El Djazaïr', contactName: 'Kamel Benatia', phone: '+213 555 100 006', address: 'Bab El Oued, Alger', city: 'Alger', region: 'Alger', latitude: 36.7942, longitude: 3.0486, type: 'boutique', status: 'active', sector: 'Alimentation', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_7', companyName: 'Grossiste Tlemcen', contactName: 'Hassan Tlemceni', phone: '+213 555 100 007', whatsapp: '+213 555 100 007', address: 'Route Nationale, Tlemcen', city: 'Tlemcen', region: 'Tlemcen', latitude: 34.8827, longitude: -1.3156, type: 'grossiste', status: 'active', sector: 'Gros', commercialId: 'usr_2', companyId } }),
      db.client.create({ data: { id: 'cli_8', companyName: 'Boutique Annaba Food', contactName: 'Leila Annabi', phone: '+213 555 100 008', address: 'Rue Ibn Khaldoun, Annaba', city: 'Annaba', region: 'Annaba', latitude: 36.9115, longitude: 7.7548, type: 'boutique', status: 'prospect', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_9', companyName: 'Marché Sétif', contactName: 'Mourad Settif', phone: '+213 555 100 009', address: 'Avenue du 1er Novembre, Sétif', city: 'Sétif', region: 'Sétif', latitude: 36.1894, longitude: 5.4101, type: 'revendeur', status: 'active', sector: 'Alimentation', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_10', companyName: 'Épicerie Bejaia', contactName: 'Yacine Bejaoui', phone: '+213 555 100 010', whatsapp: '+213 555 100 010', address: 'Port de pêche, Béjaïa', city: 'Béjaïa', region: 'Béjaïa', latitude: 36.7531, longitude: 5.0582, type: 'boutique', status: 'active', sector: 'Alimentation', commercialId: 'usr_2', companyId } }),
      db.client.create({ data: { id: 'cli_11', companyName: 'Supermarché Ouargla', contactName: 'Salim Ouargli', phone: '+213 555 100 011', address: 'Cité Ksar, Ouargla', city: 'Ouargla', region: 'Ouargla', latitude: 31.9495, longitude: 5.3281, type: 'supermarche', status: 'active', sector: 'Grande distribution', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_12', companyName: 'Boutique Ghardaia', contactName: 'Fatma Ghardaoui', phone: '+213 555 100 012', address: 'Ville Nouvelle, Ghardaïa', city: 'Ghardaïa', region: 'Ghardaïa', latitude: 32.4934, longitude: 3.6676, type: 'boutique', status: 'inactive', sector: 'Alimentation', commercialId: 'usr_4', companyId } }),
    ])

    // Create Orders
    const statuses = ['new', 'validated', 'preparation', 'shipped', 'delivered']
    for (let i = 1; i <= 20; i++) {
      const clientIdx = (i - 1) % clients.length
      const commercialIdx = (i - 1) % 3 + 1
      const total = Math.round((Math.random() * 50000 + 5000) * 100) / 100
      const status = statuses[i % statuses.length]
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))

      await db.order.create({
        data: {
          id: `ord_${i}`,
          number: `CMD-2024-${String(i).padStart(4, '0')}`,
          status,
          total,
          discount: Math.random() > 0.7 ? Math.round(total * 0.05 * 100) / 100 : 0,
          tax: Math.round(total * 0.19 * 100) / 100,
          clientId: clients[clientIdx].id,
          commercialId: users[commercialIdx].id,
          companyId,
          createdAt: date,
          items: {
            create: [
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 50 + 5),
                unitPrice: Math.round(Math.random() * 500 + 50),
                totalPrice: Math.round(Math.random() * 10000 + 1000),
              },
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 30 + 3),
                unitPrice: Math.round(Math.random() * 300 + 30),
                totalPrice: Math.round(Math.random() * 5000 + 500),
              },
            ],
          },
        },
      })
    }

    // Create Quotes
    const quoteStatuses = ['draft', 'sent', 'accepted', 'refused']
    for (let i = 1; i <= 15; i++) {
      const clientIdx = (i - 1) % clients.length
      const commercialIdx = (i - 1) % 3 + 1
      const total = Math.round((Math.random() * 40000 + 3000) * 100) / 100

      await db.quote.create({
        data: {
          id: `quo_${i}`,
          number: `DEV-2024-${String(i).padStart(4, '0')}`,
          status: quoteStatuses[i % quoteStatuses.length],
          total,
          discount: Math.random() > 0.7 ? Math.round(total * 0.05 * 100) / 100 : 0,
          tax: Math.round(total * 0.19 * 100) / 100,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          clientId: clients[clientIdx].id,
          commercialId: users[commercialIdx].id,
          companyId,
          items: {
            create: [
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 40 + 5),
                unitPrice: Math.round(Math.random() * 400 + 50),
                totalPrice: Math.round(Math.random() * 8000 + 1000),
              },
            ],
          },
        },
      })
    }

    // Create Invoices
    const invStatuses = ['paid', 'partially_paid', 'unpaid', 'overdue']
    for (let i = 1; i <= 15; i++) {
      const clientIdx = (i - 1) % clients.length
      const commercialIdx = (i - 1) % 3 + 1
      const total = Math.round((Math.random() * 60000 + 5000) * 100) / 100
      const status = invStatuses[i % invStatuses.length]

      await db.invoice.create({
        data: {
          id: `inv_${i}`,
          number: `FAC-2024-${String(i).padStart(4, '0')}`,
          status,
          total,
          paid: status === 'paid' ? total : status === 'partially_paid' ? Math.round(total * 0.6) : 0,
          discount: 0,
          tax: Math.round(total * 0.19 * 100) / 100,
          dueDate: new Date(Date.now() + (i % 3 === 0 ? -5 : 30) * 24 * 60 * 60 * 1000),
          clientId: clients[clientIdx].id,
          commercialId: users[commercialIdx].id,
          companyId,
          items: {
            create: [
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 50 + 5),
                unitPrice: Math.round(Math.random() * 500 + 50),
                totalPrice: Math.round(Math.random() * 10000 + 1000),
              },
            ],
          },
          payments: status !== 'unpaid' ? {
            create: {
              amount: status === 'paid' ? total : Math.round(total * 0.6),
              method: ['cash', 'bank_transfer', 'check'][i % 3],
              status: 'completed',
              clientId: clients[clientIdx].id,
              companyId,
            },
          } : undefined,
        },
      })
    }

    // Create Stock Movements
    for (let i = 1; i <= 25; i++) {
      await db.stockMovement.create({
        data: {
          id: `stm_${i}`,
          type: ['entry', 'exit', 'adjustment'][i % 3],
          quantity: Math.floor(Math.random() * 100 + 10) * (i % 3 === 1 ? -1 : 1),
          reason: i % 3 === 2 ? 'Correction inventaire' : undefined,
          productId: products[Math.floor(Math.random() * products.length)].id,
          companyId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Create Visits
    for (let i = 1; i <= 30; i++) {
      await db.visit.create({
        data: {
          id: `vis_${i}`,
          type: ['visit', 'call', 'note'][i % 3],
          status: ['planned', 'completed', 'completed'][i % 3],
          notes: i % 3 === 0 ? 'Client satisfait, commande prévue' : i % 3 === 1 ? 'Appel suivi devis' : undefined,
          clientId: clients[(i - 1) % clients.length].id,
          commercialId: users[(i % 3) + 1].id,
          companyId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Create Discussions
    const discussionTypes = ['message', 'call', 'note', 'whatsapp']
    const messages = [
      'Bonjour, pouvez-vous me confirmer la livraison de demain ?',
      'Votre commande CMD-2024-0015 a été expédiée.',
      'Merci pour le devis, je vais l\'étudier.',
      'N\'oubliez pas la promotion sur les boissons ce mois-ci.',
      'Le paiement de la facture FAC-2024-0003 est effectué.',
    ]
    for (let i = 1; i <= 20; i++) {
      await db.discussion.create({
        data: {
          id: `dis_${i}`,
          type: discussionTypes[i % 4],
          content: messages[i % 5],
          direction: i % 2 === 0 ? 'incoming' : 'outgoing',
          clientId: clients[(i - 1) % clients.length].id,
          commercialId: users[(i % 3) + 1].id,
          companyId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Create Targets
    await db.target.createMany({
      data: [
        { id: 'tgt_1', type: 'revenue', value: 500000, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 385000, userId: 'usr_2' },
        { id: 'tgt_2', type: 'revenue', value: 450000, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 320000, userId: 'usr_3' },
        { id: 'tgt_3', type: 'revenue', value: 400000, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 410000, userId: 'usr_4' },
        { id: 'tgt_4', type: 'clients', value: 20, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 15, userId: 'usr_2' },
        { id: 'tgt_5', type: 'clients', value: 18, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 12, userId: 'usr_3' },
        { id: 'tgt_6', type: 'clients', value: 15, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 16, userId: 'usr_4' },
      ],
    })

    return NextResponse.json({ message: 'Database seeded successfully', clients: clients.length, products: products.length })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const clients = await db.client.count()
  const products = await db.product.count()
  const orders = await db.order.count()
  return NextResponse.json({ clients, products, orders })
}
