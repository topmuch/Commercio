import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const companyId = 'cmp_test01'
  
  // Create company
  await db.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: 'Teranga Distribution',
      email: 'test@teranga.sn',
      phone: '+221 77 123 4567',
      address: 'Dakar, Sénégal',
      logo: null,
    }
  })
  console.log('✓ Company created')

  // Create user
  const hashedPassword = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu6GK'
  await db.user.upsert({
    where: { id: 'usr_1' },
    update: {},
    create: {
      id: 'usr_1',
      name: 'Admin',
      email: 'admin@teranga.sn',
      password: hashedPassword,
      role: 'super_admin',
      companyId,
    }
  })
  console.log('✓ User created (admin@teranga.sn / password123)')

  // Create categories
  await Promise.all([
    db.category.upsert({ where: { id: 'cat_boissons' }, update: {}, create: { id: 'cat_boissons', name: 'Boissons', companyId } }),
    db.category.upsert({ where: { id: 'cat_snacks' }, update: {}, create: { id: 'cat_snacks', name: 'Snacks & Confiseries', companyId } }),
    db.category.upsert({ where: { id: 'cat_lait' }, update: {}, create: { id: 'cat_lait', name: 'Produits Laitiers', companyId } }),
    db.category.upsert({ where: { id: 'cat_hygiene' }, update: {}, create: { id: 'cat_hygiene', name: 'Hygiène & Beauté', companyId } }),
  ])
  console.log('✓ 4 categories created')

  // Create products with and without images
  const products = [
    { id: 'prod_1', name: 'Coca-Cola 33cl', reference: 'BOI-001', price: 350, resellerPrice: 250, image: '/uploads/boutique/coca.jpg', categoryId: 'cat_boissons', brand: 'Coca-Cola', stock: 500, companyId },
    { id: 'prod_2', name: 'Sprite 33cl', reference: 'BOI-002', price: 350, resellerPrice: 250, image: '/uploads/boutique/sprite.jpg', categoryId: 'cat_boissons', brand: 'Coca-Cola', stock: 300, companyId },
    { id: 'prod_3', name: 'Biskuit Excel', reference: 'SNK-001', price: 150, resellerPrice: 100, image: null, categoryId: 'cat_snacks', brand: 'Britannia', stock: 800, companyId },
    { id: 'prod_4', name: 'Lait Dolce 1L', reference: 'LAI-001', price: 1500, resellerPrice: 1100, image: '/uploads/boutique/lait-dolce.jpg', categoryId: 'cat_lait', brand: 'Dolce', stock: 200, companyId },
    { id: 'prod_5', name: 'Savon Tura', reference: 'HYG-001', price: 400, resellerPrice: 280, image: null, categoryId: 'cat_hygiene', brand: 'Tura', stock: 400, companyId },
    { id: 'prod_6', name: 'Fanta Orange 33cl', reference: 'BOI-003', price: 350, resellerPrice: 250, image: '/uploads/boutique/fanta.jpg', categoryId: 'cat_boissons', brand: 'Coca-Cola', stock: 250, companyId },
    { id: 'prod_7', name: 'Yaourt Vitalait', reference: 'LAI-002', price: 500, resellerPrice: 350, image: '/uploads/boutique/yaourt.jpg', categoryId: 'cat_lait', brand: 'Vitalait', stock: 150, companyId },
    { id: 'prod_8', name: 'Biscuit Choco Vital', reference: 'SNK-002', price: 200, resellerPrice: 140, image: null, categoryId: 'cat_snacks', brand: 'Vital', stock: 600, companyId },
  ]
  for (const p of products) {
    await db.product.upsert({ where: { reference: p.reference }, update: {}, create: p })
  }
  console.log(`✓ ${products.length} products created`)

  // Store settings
  await db.storeSettings.upsert({
    where: { companyId },
    update: {},
    create: {
      companyId, storeTitle: 'Teranga Distribution',
      storeDescription: 'Votre distributeur de confiance à Dakar.',
      whatsappNumber: '+221771234567', currency: 'FCFA', isActive: true,
      publicSlug: 'teranga-dist', logoUrl: '/uploads/boutique/logo-teranga.jpg',
      primaryColor: '#10B981',
    }
  })
  console.log('✓ Store settings (slug: teranga-dist)')

  // Banners
  await db.storeBanner.createMany({
    data: [
      { companyId, imageUrl: '/uploads/boutique/banner1.jpg', title: 'Promo Boissons !', subtitle: '-20% sur toutes les boissons', displayOrder: 0, isActive: true, startDate: new Date() },
      { companyId, imageUrl: '/uploads/boutique/banner2.jpg', title: 'Nouveautés', subtitle: 'Découvrez nos nouveaux produits', displayOrder: 1, isActive: true, startDate: new Date() },
    ],
    skipDuplicates: true,
  })
  console.log('✓ 2 banners created')

  // Create dummy image files
  const fs = await import('fs/promises')
  const path = await import('path')
  const uploadsDir = path.join(process.cwd(), 'uploads', 'boutique')
  await fs.mkdir(uploadsDir, { recursive: true })
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
  for (const name of ['coca.jpg', 'sprite.jpg', 'lait-dolce.jpg', 'fanta.jpg', 'yaourt.jpg', 'logo-teranga.jpg', 'banner1.jpg', 'banner2.jpg']) {
    await fs.writeFile(path.join(uploadsDir, name), pngBuffer)
  }
  console.log('✓ 8 dummy images in uploads/boutique/')
  console.log('\n✅ Seed done! Test: http://localhost:3000/boutique/teranga-dist')
}

main().catch(console.error).finally(() => db.$disconnect())
