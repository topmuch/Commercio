import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const db = new PrismaClient()

async function main() {
  try {
    await db.storeBanner.create({
      data: { companyId: 'cmp_test01', imageUrl: '/uploads/boutique/banner1.jpg', title: 'Promo Boissons !', subtitle: '-20% sur toutes les boissons', displayOrder: 0, isActive: true, startDate: new Date() }
    })
    await db.storeBanner.create({
      data: { companyId: 'cmp_test01', imageUrl: '/uploads/boutique/banner2.jpg', title: 'Nouveautés', subtitle: 'Découvrez nos nouveaux produits', displayOrder: 1, isActive: true, startDate: new Date() }
    })
    console.log('✓ Banners created')
  } catch (e: any) {
    console.log('Banner error (may exist):', e.message?.substring(0, 100))
  }

  // Create dummy image files
  const uploadsDir = join(process.cwd(), 'uploads', 'boutique')
  await mkdir(uploadsDir, { recursive: true })
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
  for (const name of ['coca.jpg', 'sprite.jpg', 'lait-dolce.jpg', 'fanta.jpg', 'yaourt.jpg', 'logo-teranga.jpg', 'banner1.jpg', 'banner2.jpg']) {
    await writeFile(join(uploadsDir, name), pngBuffer)
  }
  console.log('✓ 8 dummy images created')

  // Verify data
  const productCount = await db.product.count()
  const storeSettings = await db.storeSettings.findUnique({ where: { companyId: 'cmp_test01' } })
  const bannerCount = await db.storeBanner.count()
  console.log(`\nDB State: ${productCount} products, ${bannerCount} banners, slug=${storeSettings?.publicSlug}`)
}

main().catch(console.error).finally(() => db.$disconnect())
