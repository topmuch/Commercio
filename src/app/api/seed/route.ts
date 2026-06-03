import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const companyId = 'comp_1'

    // Check if data already exists
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    if (!force) {
      const existingClients = await db.client.count({ where: { companyId } })
      if (existingClients > 0) {
        return NextResponse.json({ message: 'Data already seeded', count: existingClients })
      }
    } else {
      // Clean existing data when force=true
      await db.payment.deleteMany({})
      await db.invoiceItem.deleteMany({})
      await db.invoice.deleteMany({})
      await db.orderItem.deleteMany({})
      await db.order.deleteMany({})
      await db.quoteItem.deleteMany({})
      await db.quote.deleteMany({})
      await db.stockMovement.deleteMany({})
      await db.visit.deleteMany({})
      await db.discussion.deleteMany({})
      await db.target.deleteMany({})
      await db.client.deleteMany({})
      await db.product.deleteMany({})
      await db.category.deleteMany({})
      await db.user.deleteMany({})
      await db.storeSettings.deleteMany({})
      await db.company.deleteMany({})
    }

    // =====================================================
    // Company — Generic Senegalese distribution company
    // =====================================================
    await db.company.upsert({
      where: { email: 'contact@distribusn.com' },
      update: {},
      create: {
        id: companyId,
        name: 'DistribuSN – Distribution Générale',
        email: 'contact@distribusn.com',
        phone: '+221 33 800 00 01',
        address: '45 Avenue Blaise Diagne, Dakar',
        plan: 'enterprise',
      },
    })

    // =====================================================
    // Users — 1 admin, 1 director, 3 commercials
    // =====================================================
    const users = await Promise.all([
      db.user.create({
        data: {
          id: 'usr_1', email: 'mamadou@distribusn.com', password: 'hashed', name: 'Mamadou Diallo',
          phone: '+221 77 100 00 01', role: 'admin', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_2', email: 'fatou@distribusn.com', password: 'hashed', name: 'Fatou Sylla',
          phone: '+221 77 100 00 02', role: 'director', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_3', email: 'ibrahima@distribusn.com', password: 'hashed', name: 'Ibrahima Ndiaye',
          phone: '+221 77 100 00 03', role: 'commercial', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_4', email: 'aissatou@distribusn.com', password: 'hashed', name: 'Aissatou Ba',
          phone: '+221 77 100 00 04', role: 'commercial', companyId,
        },
      }),
      db.user.create({
        data: {
          id: 'usr_5', email: 'ousmane@distribusn.com', password: 'hashed', name: 'Ousmane Diop',
          phone: '+221 77 100 00 05', role: 'commercial', companyId,
        },
      }),
    ])

    // =====================================================
    // Categories — 8 categories
    // =====================================================
    const categories = await Promise.all([
      db.category.create({ data: { id: 'cat_1', name: 'Boissons', companyId } }),
      db.category.create({ data: { id: 'cat_2', name: 'Alimentation', companyId } }),
      db.category.create({ data: { id: 'cat_3', name: 'Entretien', companyId } }),
      db.category.create({ data: { id: 'cat_4', name: 'Produits Laitiers', companyId } }),
      db.category.create({ data: { id: 'cat_5', name: 'Conserves', companyId } }),
      db.category.create({ data: { id: 'cat_6', name: 'Hygiène', companyId } }),
      db.category.create({ data: { id: 'cat_7', name: 'Jus & Sodas', parentId: 'cat_1', companyId } }),
      db.category.create({ data: { id: 'cat_8', name: 'Eau minérale', parentId: 'cat_1', companyId } }),
    ])

    // =====================================================
    // Products — 17 products, prices in FCFA (500 – 50 000)
    // =====================================================
    const products = await Promise.all([
      db.product.create({ data: { id: 'prod_1', name: 'Coca-Cola 33cl', reference: 'BOI-001', price: 350, resellerPrice: 280, stock: 500, minStock: 50, categoryId: 'cat_7', brand: 'Coca-Cola', companyId } }),
      db.product.create({ data: { id: 'prod_2', name: 'Sprite 33cl', reference: 'BOI-002', price: 350, resellerPrice: 280, stock: 400, minStock: 50, categoryId: 'cat_7', brand: 'Coca-Cola', companyId } }),
      db.product.create({ data: { id: 'prod_3', name: 'Youki Jus d\'Ananas 1L', reference: 'BOI-003', price: 500, resellerPrice: 400, stock: 300, minStock: 40, categoryId: 'cat_7', brand: 'Youki', companyId } }),
      db.product.create({ data: { id: 'prod_4', name: 'Folli Jus d\'Ananas 1L', reference: 'BOI-004', price: 600, resellerPrice: 480, stock: 250, minStock: 30, categoryId: 'cat_7', brand: 'Folli', companyId } }),
      db.product.create({ data: { id: 'prod_5', name: 'Aqua Terminale 1.5L', reference: 'BOI-005', price: 200, resellerPrice: 150, stock: 1200, minStock: 150, categoryId: 'cat_8', brand: 'Aqua Terminale', companyId } }),
      db.product.create({ data: { id: 'prod_6', name: 'Riz Tatam 25kg', reference: 'ALI-001', price: 16500, resellerPrice: 14500, stock: 200, minStock: 20, categoryId: 'cat_2', brand: 'Tatam', companyId } }),
      db.product.create({ data: { id: 'prod_7', name: 'Huile de table Djama 5L', reference: 'ALI-002', price: 8500, resellerPrice: 7500, stock: 150, minStock: 15, categoryId: 'cat_2', brand: 'Djama', companyId } }),
      db.product.create({ data: { id: 'prod_8', name: 'Café Moulu Kakao 250g', reference: 'ALI-003', price: 2800, resellerPrice: 2300, stock: 250, minStock: 30, categoryId: 'cat_2', brand: 'Kakao', companyId } }),
      db.product.create({ data: { id: 'prod_9', name: 'Cubes Maggi 12 pcs', reference: 'ALI-004', price: 750, resellerPrice: 600, stock: 400, minStock: 50, categoryId: 'cat_2', brand: 'Maggi', companyId } }),
      db.product.create({ data: { id: 'prod_10', name: 'Kiss Margarine 500g', reference: 'ALI-005', price: 1200, resellerPrice: 950, stock: 350, minStock: 40, categoryId: 'cat_2', brand: 'Kiss', companyId } }),
      db.product.create({ data: { id: 'prod_11', name: 'Omo Poudre 500g', reference: 'ENT-001', price: 1500, resellerPrice: 1200, stock: 180, minStock: 25, categoryId: 'cat_3', brand: 'Omo', companyId } }),
      db.product.create({ data: { id: 'prod_12', name: 'Savon de Marseille 400g', reference: 'ENT-002', price: 450, resellerPrice: 350, stock: 300, minStock: 30, categoryId: 'cat_3', brand: 'Marseille', companyId } }),
      db.product.create({ data: { id: 'prod_13', name: 'Yaourt Dolce Gusto pack 6', reference: 'LAIT-001', price: 5000, resellerPrice: 4200, stock: 120, minStock: 15, categoryId: 'cat_4', brand: 'Dolce Gusto', companyId } }),
      db.product.create({ data: { id: 'prod_14', name: 'Lait UHT Vitalait 1L', reference: 'LAIT-002', price: 750, resellerPrice: 600, stock: 800, minStock: 100, categoryId: 'cat_4', brand: 'Vitalait', companyId } }),
      db.product.create({ data: { id: 'prod_15', name: 'Sardines John West 125g', reference: 'CON-001', price: 850, resellerPrice: 680, stock: 300, minStock: 30, categoryId: 'cat_5', brand: 'John West', companyId } }),
      db.product.create({ data: { id: 'prod_16', name: 'Conserve Tomate Mutti 400g', reference: 'CON-002', price: 650, resellerPrice: 520, stock: 250, minStock: 25, categoryId: 'cat_5', brand: 'Mutti', companyId } }),
      db.product.create({ data: { id: 'prod_17', name: 'Shampooing Dove 400ml', reference: 'HYG-001', price: 3500, resellerPrice: 2800, stock: 180, minStock: 25, categoryId: 'cat_6', brand: 'Dove', companyId } }),
    ])

    // =====================================================
    // Clients — 15 clients across Senegalese cities & regions
    //   statuses: lead_rouge, negociation_orange, client_vert
    // =====================================================
    const clients = await Promise.all([
      // --- client_vert (active clients, have purchased) ---
      db.client.create({ data: { id: 'cli_1', companyName: 'SARL Boutique du Coin', contactName: 'Abdoulaye Sow', phone: '+221 77 200 00 01', whatsapp: '+221 77 200 00 01', email: 'boutique.ducoin@orange.sn', address: 'Rue 10, Plateau', city: 'Dakar', region: 'Dakar', latitude: 14.6937, longitude: -17.4441, type: 'boutique', status: 'client_vert', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_2', companyName: 'Épicerie Chez Omar', contactName: 'Omar Fall', phone: '+221 77 200 00 02', whatsapp: '+221 77 200 00 02', email: 'omar.epicerie@gmail.com', address: 'Avenue Lamine Guèye', city: 'Dakar', region: 'Dakar', latitude: 14.7012, longitude: -17.4520, type: 'boutique', status: 'client_vert', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_3', companyName: 'Supermarché Sobatex', contactName: 'Aminata Diop', phone: '+221 77 200 00 03', whatsapp: '+221 77 200 00 03', email: 'contact@sobatex.sn', address: 'Route de Rufisque, Liberté 6', city: 'Dakar', region: 'Dakar', latitude: 14.7350, longitude: -17.4600, type: 'supermarche', status: 'client_vert', sector: 'Grande distribution', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_4', companyName: 'Grossiste Auchan Express', contactName: 'Cheikh Mbaye', phone: '+221 77 200 00 04', whatsapp: '+221 77 200 00 04', email: 'grossiste.auchan@gmail.com', address: 'Zone Commerciale, Diamniadio', city: 'Rufisque', region: 'Dakar', latitude: 14.7253, longitude: -17.2597, type: 'grossiste', status: 'client_vert', sector: 'Gros', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_5', companyName: 'Alimentation Chez Fatou', contactName: 'Fatou Sarr', phone: '+221 77 200 00 05', whatsapp: '+221 77 200 00 05', address: 'Marché Sandaga', city: 'Dakar', region: 'Dakar', latitude: 14.6850, longitude: -17.4430, type: 'boutique', status: 'client_vert', sector: 'Alimentation', commercialId: 'usr_5', companyId } }),
      db.client.create({ data: { id: 'cli_6', companyName: 'Mini Market Liberté', contactName: 'Malick Ndiaye', phone: '+221 77 200 00 06', whatsapp: '+221 77 200 00 06', address: 'Carrefour Liberté', city: 'Pikine', region: 'Dakar', latitude: 14.7645, longitude: -17.3904, type: 'revendeur', status: 'client_vert', sector: 'Alimentation', commercialId: 'usr_5', companyId } }),
      db.client.create({ data: { id: 'cli_7', companyName: 'Épicerie Modou & Fils', contactName: 'Modou Gueye', phone: '+221 77 200 00 07', whatsapp: '+221 77 200 00 07', email: 'modou.fils@gmail.com', address: 'Avenue de la République', city: 'Thiès', region: 'Thiès', latitude: 14.7936, longitude: -16.9371, type: 'boutique', status: 'client_vert', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_8', companyName: 'Superette le Saloum', contactName: 'Adama Dia', phone: '+221 77 200 00 08', address: 'Centre-ville, Kaolack', city: 'Kaolack', region: 'Kaolack', latitude: 14.1755, longitude: -16.0797, type: 'supermarche', status: 'client_vert', sector: 'Grande distribution', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_9', companyName: 'Grossiste Teranga Wholesale', contactName: 'Boubacar Sy', phone: '+221 77 200 00 09', whatsapp: '+221 77 200 00 09', email: 'teranga.wholesale@gmail.com', address: 'Zone Industrielle', city: 'Saint-Louis', region: 'Saint-Louis', latitude: 16.4581, longitude: -16.4530, type: 'grossiste', status: 'client_vert', sector: 'Gros', commercialId: 'usr_5', companyId } }),

      // --- negociation_orange (negotiation in progress, quote sent) ---
      db.client.create({ data: { id: 'cli_10', companyName: 'Boutique Diallo Commerce', contactName: 'Moussa Diallo', phone: '+221 77 200 00 10', whatsapp: '+221 77 200 00 10', address: 'Quartier Médina', city: 'Dakar', region: 'Dakar', latitude: 14.6910, longitude: -17.4390, type: 'boutique', status: 'negociation_orange', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_11', companyName: 'Dépôt Kolda Distribution', contactName: 'Seydou Bâ', phone: '+221 77 200 00 11', whatsapp: '+221 77 200 00 11', email: 'kolda.depot@gmail.com', address: 'Route Nationale 6', city: 'Kolda', region: 'Kolda', latitude: 12.8894, longitude: -14.9447, type: 'grossiste', status: 'negociation_orange', sector: 'Gros', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_12', companyName: 'Épicerie Chez Aminata', contactName: 'Aminata Thioub', phone: '+221 77 200 00 12', address: 'Marché Kermel', city: 'Dakar', region: 'Dakar', latitude: 14.6720, longitude: -17.4370, type: 'boutique', status: 'negociation_orange', sector: 'Alimentation', commercialId: 'usr_5', companyId } }),
      db.client.create({ data: { id: 'cli_13', companyName: 'Alimentation du Quartier', contactName: 'Yacine Diouf', phone: '+221 77 200 00 13', whatsapp: '+221 77 200 00 13', address: 'Quartier Grand Yoff', city: 'Dakar', region: 'Dakar', latitude: 14.7480, longitude: -17.4760, type: 'revendeur', status: 'negociation_orange', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_14', companyName: 'SARL Sénégal Boissons', contactName: 'Aliou Sow', phone: '+221 77 200 00 14', whatsapp: '+221 77 200 00 14', email: 'sn.boissons@gmail.com', address: 'Route de Ziguinchor', city: 'Ziguinchor', region: 'Ziguinchor', latitude: 12.5833, longitude: -16.2244, type: 'grossiste', status: 'negociation_orange', sector: 'Boissons', commercialId: 'usr_4', companyId } }),

      // --- lead_rouge (prospects, not yet purchased) ---
      db.client.create({ data: { id: 'cli_15', companyName: 'Marché Sandaga Provisions', contactName: 'Ousmane Wade', phone: '+221 77 200 00 15', address: 'Avenue Pompidou', city: 'Dakar', region: 'Dakar', latitude: 14.6830, longitude: -17.4410, type: 'revendeur', status: 'lead_rouge', sector: 'Alimentation', commercialId: 'usr_5', companyId } }),
      db.client.create({ data: { id: 'cli_16', companyName: 'Épicerie de Tambacounda', contactName: 'Demba Cissé', phone: '+221 77 200 00 16', address: 'Avenue du 4 Avril', city: 'Tambacounda', region: 'Tambacounda', latitude: 13.7708, longitude: -13.1942, type: 'boutique', status: 'lead_rouge', sector: 'Alimentation', commercialId: 'usr_3', companyId } }),
      db.client.create({ data: { id: 'cli_17', companyName: 'Superette Diourbel', contactName: 'Mariama Ba', phone: '+221 77 200 00 17', whatsapp: '+221 77 200 00 17', address: 'Place de l\'Indépendance', city: 'Diourbel', region: 'Diourbel', latitude: 14.6500, longitude: -16.2364, type: 'boutique', status: 'lead_rouge', sector: 'Alimentation', commercialId: 'usr_4', companyId } }),
      db.client.create({ data: { id: 'cli_18', companyName: 'Grossiste Louga Market', contactName: 'Biram Diop', phone: '+221 77 200 00 18', address: 'Route de Louga', city: 'Louga', region: 'Louga', latitude: 15.6139, longitude: -16.2181, type: 'grossiste', status: 'lead_rouge', sector: 'Gros', commercialId: 'usr_5', companyId } }),
    ])

    // =====================================================
    // Orders — 25 orders (totals in FCFA)
    // =====================================================
    const statuses = ['new', 'validated', 'preparation', 'shipped', 'delivered']
    for (let i = 1; i <= 25; i++) {
      const clientIdx = (i - 1) % clients.length
      const commercialIdx = (i - 1) % 3 + 2 // usr_3, usr_4, usr_5
      const total = Math.round((Math.random() * 2000000 + 100000) * 100) / 100
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
          tax: 0, // FCFA transactions in Senegal are typically tax-inclusive
          clientId: clients[clientIdx].id,
          commercialId: users[commercialIdx].id,
          companyId,
          createdAt: date,
          items: {
            create: [
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 50 + 5),
                unitPrice: Math.round(Math.random() * 5000 + 350),
                totalPrice: Math.round(Math.random() * 200000 + 15000),
              },
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 30 + 3),
                unitPrice: Math.round(Math.random() * 3000 + 200),
                totalPrice: Math.round(Math.random() * 100000 + 8000),
              },
            ],
          },
        },
      })
    }

    // =====================================================
    // Quotes — 15 quotes
    // =====================================================
    const quoteStatuses = ['draft', 'sent', 'accepted', 'refused']
    for (let i = 1; i <= 15; i++) {
      const clientIdx = (i - 1) % clients.length
      const commercialIdx = (i - 1) % 3 + 2
      const total = Math.round((Math.random() * 1500000 + 80000) * 100) / 100

      await db.quote.create({
        data: {
          id: `quo_${i}`,
          number: `DEV-2024-${String(i).padStart(4, '0')}`,
          status: quoteStatuses[i % quoteStatuses.length],
          total,
          discount: Math.random() > 0.7 ? Math.round(total * 0.05 * 100) / 100 : 0,
          tax: 0,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          clientId: clients[clientIdx].id,
          commercialId: users[commercialIdx].id,
          companyId,
          items: {
            create: [
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 40 + 5),
                unitPrice: Math.round(Math.random() * 4000 + 350),
                totalPrice: Math.round(Math.random() * 150000 + 10000),
              },
            ],
          },
        },
      })
    }

    // =====================================================
    // Invoices — 15 invoices
    // =====================================================
    const invStatuses = ['paid', 'partially_paid', 'unpaid', 'overdue']
    for (let i = 1; i <= 15; i++) {
      const clientIdx = (i - 1) % clients.length
      const commercialIdx = (i - 1) % 3 + 2
      const total = Math.round((Math.random() * 2500000 + 100000) * 100) / 100
      const status = invStatuses[i % invStatuses.length]

      await db.invoice.create({
        data: {
          id: `inv_${i}`,
          number: `FAC-2024-${String(i).padStart(4, '0')}`,
          status,
          total,
          paid: status === 'paid' ? total : status === 'partially_paid' ? Math.round(total * 0.6) : 0,
          discount: 0,
          tax: 0,
          dueDate: new Date(Date.now() + (i % 3 === 0 ? -5 : 30) * 24 * 60 * 60 * 1000),
          clientId: clients[clientIdx].id,
          commercialId: users[commercialIdx].id,
          companyId,
          items: {
            create: [
              {
                productId: products[Math.floor(Math.random() * products.length)].id,
                quantity: Math.floor(Math.random() * 50 + 5),
                unitPrice: Math.round(Math.random() * 5000 + 350),
                totalPrice: Math.round(Math.random() * 200000 + 15000),
              },
            ],
          },
          payments: status !== 'unpaid' ? {
            create: {
              amount: status === 'paid' ? total : Math.round(total * 0.6),
              method: ['cash', 'mobile_payment', 'bank_transfer'][i % 3],
              status: 'completed',
              clientId: clients[clientIdx].id,
              companyId,
            },
          } : undefined,
        },
      })
    }

    // =====================================================
    // Stock Movements — 25 entries
    // =====================================================
    const movementReasons: Record<number, string> = {
      0: 'Livraison CMD-2024-0003',
      1: 'Réception fournisseur',
      2: 'Correction inventaire',
    }
    for (let i = 1; i <= 25; i++) {
      const moveType = (['entry', 'exit', 'adjustment'] as const)[i % 3]
      await db.stockMovement.create({
        data: {
          id: `stm_${i}`,
          type: moveType,
          quantity: Math.floor(Math.random() * 100 + 10) * (moveType === 'exit' ? -1 : 1),
          reason: movementReasons[i % 3],
          productId: products[Math.floor(Math.random() * products.length)].id,
          companyId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // =====================================================
    // Visits — 20 visits
    // =====================================================
    const visitNotes = [
      'Client satisfait, commande prévue la semaine prochaine.',
      'Appel de suivi devis DEV-2024-0005.',
      'Prospect intéressé par les produits Youki et Folli.',
      'Visite de prise de commande — 3 produits commandés.',
      'Client demande une réduction sur les grosses commandes.',
      'Rendez-vous reporté au lundi suivant.',
      'Nouveau prospect rencontré au marché Sandaga.',
      'Livraison retardée, client informé.',
    ]
    for (let i = 1; i <= 20; i++) {
      const visitType = (['visit', 'call', 'note'] as const)[i % 3]
      await db.visit.create({
        data: {
          id: `vis_${i}`,
          type: visitType,
          status: (['planned', 'completed', 'completed'] as const)[i % 3],
          notes: visitNotes[i % visitNotes.length],
          latitude: 14.6937 + (Math.random() - 0.5) * 2,
          longitude: -17.4441 + (Math.random() - 0.5) * 4,
          clientId: clients[(i - 1) % clients.length].id,
          commercialId: users[((i % 3) + 2) % 5]?.id || users[2].id,
          companyId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // =====================================================
    // Discussions — 20 messages
    // =====================================================
    const discussionTypes = ['message', 'call', 'note', 'whatsapp']
    const messages = [
      'Bonjour, pouvez-vous me confirmer la livraison de demain ?',
      'Votre commande CMD-2024-0015 a été expédiée.',
      'Merci pour le devis, je vais l\'étudier avec mon associé.',
      'N\'oubliez pas la promotion sur les boissons Youki ce mois-ci.',
      'Le paiement de la facture FAC-2024-0003 a été effectué via Orange Money.',
      'Est-ce que le riz Tatam 25kg est en stock ?',
      'Je souhaite passer une commande pour 50 cartons de Coca-Cola.',
      'Le prix du Kiss Margarine a changé, voici le nouveau tarif.',
      'Livraison prévue samedi matin à Pikine.',
      'Merci, à la prochaine !',
    ]
    for (let i = 1; i <= 20; i++) {
      await db.discussion.create({
        data: {
          id: `dis_${i}`,
          type: discussionTypes[i % 4],
          content: messages[i % messages.length],
          direction: i % 2 === 0 ? 'incoming' : 'outgoing',
          clientId: clients[(i - 1) % clients.length].id,
          commercialId: users[((i % 3) + 2) % 5]?.id || users[2].id,
          companyId,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // =====================================================
    // Targets — Revenue & client targets for commercials
    // =====================================================
    await db.target.createMany({
      data: [
        // Revenue targets (in FCFA)
        { id: 'tgt_1', type: 'revenue', value: 5000000, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 3850000, userId: 'usr_3' },
        { id: 'tgt_2', type: 'revenue', value: 4500000, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 3200000, userId: 'usr_4' },
        { id: 'tgt_3', type: 'revenue', value: 4000000, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 4100000, userId: 'usr_5' },
        // Client acquisition targets
        { id: 'tgt_4', type: 'clients', value: 20, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 15, userId: 'usr_3' },
        { id: 'tgt_5', type: 'clients', value: 18, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 12, userId: 'usr_4' },
        { id: 'tgt_6', type: 'clients', value: 15, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 16, userId: 'usr_5' },
        // Visit targets
        { id: 'tgt_7', type: 'visits', value: 60, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 48, userId: 'usr_3' },
        { id: 'tgt_8', type: 'visits', value: 55, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 40, userId: 'usr_4' },
        { id: 'tgt_9', type: 'visits', value: 50, period: 'monthly', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), achieved: 52, userId: 'usr_5' },
      ],
    })

    // Store Settings for public boutique
    await db.storeSettings.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
        whatsappNumber: '+221 77 100 00 01',
        storeTitle: 'DistribuSN Boutique',
        currency: 'CFA',
        isActive: true,
      },
    })

    return NextResponse.json({
      message: 'Database seeded successfully (Senegal)',
      clients: clients.length,
      products: products.length,
      categories: categories.length,
      users: users.length,
    })
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
