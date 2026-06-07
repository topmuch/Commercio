'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Star,
  Search,
  MessageCircle,
  Phone,
  MapPin,
  ArrowLeft,
  ChevronRight,
  PackageX,
  QrCode,
  X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface StoreInfo {
  title: string
  description: string | null
  whatsappNumber: string | null
  currency: string
  company: {
    id: string
    name: string
    logo: string | null
    address: string | null
    phone: string | null
  }
}

interface Product {
  id: string
  name: string
  reference: string
  description: string | null
  price: number
  resellerPrice: number | null
  stock: number
  minStock: number
  image: string | null
  brand: string | null
  status: string
  category: { name: string } | null
}

interface CategoryItem {
  id: string
  name: string
  _count: { products: number }
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' CFA'
}

function getStockBadge(stock: number, minStock: number) {
  if (stock === 0) {
    return <Badge variant="destructive" className="text-[10px] px-1.5">Rupture</Badge>
  }
  if (stock <= minStock) {
    return <Badge className="text-[10px] px-1.5 bg-amber-500 text-white">Stock limité</Badge>
  }
  return <Badge className="text-[10px] px-1.5 bg-emerald-500 text-white">En stock</Badge>
}

function buildWhatsAppUrl(product: Product, whatsappNumber: string) {
  const phone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : ''
  const message = encodeURIComponent(
    `Bonjour, je souhaite commander :\n\n` +
    `📦 Produit : ${product.name}\n` +
    `📋 Référence : ${product.reference}\n` +
    `💰 Prix : ${formatCFA(product.price)}\n` +
    `${product.resellerPrice ? `🏷️ Prix revendeur : ${formatCFA(product.resellerPrice)}\n` : ''}` +
    `\nMerci de confirmer la disponibilité.`
  )
  return `https://wa.me/${phone}?text=${message}`
}

const gradients = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-cyan-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
  'from-red-400 to-rose-500',
  'from-blue-400 to-indigo-500',
  'from-fuchsia-400 to-pink-500',
  'from-yellow-400 to-amber-500',
  'from-teal-400 to-emerald-500',
  'from-orange-400 to-red-500',
]

const categoryIcons: Record<string, string> = {
  'Boissons': '🥤',
  'Alimentation': '🍞',
  'Entretien': '🧹',
  'Hygiène': '💅',
  'Produits Laitiers': '🥛',
  'Conserves': '🥫',
  'Jus & Sodas': '🧃',
  'Eau minérale': '💧',
}

// ── Product Card ──────────────────────────────────────────────────────

function ProductCard({ product, whatsappNumber, idx, onQR }: { product: Product; whatsappNumber: string; idx: number; onQR: (product: Product) => void }) {
  return (
    <Card className="group overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className={`relative h-48 bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center overflow-hidden`}>
        <div className="text-white/20 text-7xl font-bold select-none">
          {product.name.charAt(0)}
        </div>
        {product.brand && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/20 text-white text-[10px] px-2 py-0.5 backdrop-blur-sm border-0">
              {product.brand}
            </Badge>
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStockBadge(product.stock, product.minStock)}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>
      <CardContent className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Réf: {product.reference}
            {product.category && <span className="ml-2">· {product.category.name}</span>}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xl font-bold text-gray-900">{formatCFA(product.price)}</span>
          {product.resellerPrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Prix revendeur</span>
              <span className="text-sm font-semibold text-orange-600">{formatCFA(product.resellerPrice)}</span>
            </div>
          )}
        </div>
        <div className="mt-auto pt-2 flex gap-2">
            <a
              href={buildWhatsAppUrl(product, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
            >
              <MessageCircle className="h-4 w-4" />
              Commander
            </a>
            <button
              onClick={() => onQR(product)}
              className="shrink-0 inline-flex items-center justify-center h-[42px] w-[42px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
              title="QR Code WhatsApp"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
      </CardContent>
    </Card>
  )
}

// ── Loading Skeleton ──────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <CardContent className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full mt-4" />
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function PublicBoutiquePage() {
  const params = useParams()
  const slug = params.slug as string

  const [store, setStore] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [qrProduct, setQrProduct] = useState<Product | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/store/${slug}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Boutique introuvable')
        return
      }
      const data = json.data
      setStore(data.store)
      setProducts(data.products || [])
      setCategories(data.categories || [])
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const categoryNav = useMemo(() => {
    const nav = [{ id: 'all', label: 'Tous', icon: '🛍️', count: products.length }]
    categories.forEach((cat) => {
      const count = products.filter((p) => p.category?.name === cat.name).length
      nav.push({ id: cat.id, label: cat.name, icon: categoryIcons[cat.name] || '📦', count })
    })
    return nav
  }, [categories, products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch = activeCategory === 'all' ||
        categories.find((c) => c.id === activeCategory)?.name === p.category?.name
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchQuery.toLowerCase())
      return catMatch && matchesSearch
    })
  }, [products, activeCategory, searchQuery, categories])

  const featuredProducts = useMemo(
    () => [...products].sort((a, b) => b.stock - a.stock).slice(0, 4),
    [products]
  )

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Error State ───
  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-100 mb-4">
            <PackageX className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Boutique introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">{error || "Cette boutique n'existe pas ou a été désactivée."}</p>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  const whatsappNumber = store.whatsappNumber || ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
              {store.title.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{store.title}</h1>
              <p className="text-xs text-gray-500">{store.company.name}</p>
            </div>
          </div>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm hidden sm:inline-flex" size="sm" asChild>
            <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Contact
            </a>
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:hidden" size="icon" asChild>
            <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-10 lg:p-14">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -right-6 top-20 h-28 w-28 rounded-full bg-amber-400/20" />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-6 w-6 text-amber-300" />
              <Badge className="bg-amber-400/90 text-amber-950 border-0 font-medium">Boutique en ligne</Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">{store.title}</h2>
            <p className="text-sm sm:text-base text-white/80 mb-6 max-w-lg leading-relaxed">
              {store.description || `Découvrez notre catalogue de ${products.length} produits et commandez facilement via WhatsApp.`}
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-10 h-11 bg-white text-gray-900 placeholder:text-gray-400 border-0 shadow-lg focus-visible:ring-amber-300/50 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categoryNav.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-60">({cat.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Featured Products */}
        {activeCategory === 'all' && !searchQuery && featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Star className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">Produits Populaires</h3>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-xs border-amber-200">
                {featuredProducts.length} articles
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={whatsappNumber}
                  idx={products.findIndex((p) => p.id === product.id)}
                  onQR={(p) => { setQrProduct(p); setShowQR(true) }}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">
                {activeCategory === 'all' ? 'Tous les produits' : categoryNav.find((c) => c.id === activeCategory)?.label}
              </h3>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{filteredProducts.length} articles</Badge>
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-gray-500 text-xs">Effacer</Button>
            )}
          </div>
          {filteredProducts.length === 0 ? (
            <Card className="border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 font-medium">Aucun produit trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} whatsappNumber={whatsappNumber} idx={idx} onQR={(p) => { setQrProduct(p); setShowQR(true) }} />
              ))}
            </div>
          )}
        </section>

        {/* Footer CTA */}
        <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Phone className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="font-semibold text-gray-900">Besoin d&apos;aide pour commander ?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Contactez notre équipe directement via WhatsApp pour une assistance personnalisée.
              {store.company.address && (
                <span className="inline-flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {store.company.address}
                </span>
              )}
            </p>
          </div>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" asChild>
            <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
            </a>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Propulsé par <span className="font-semibold text-gray-600">Teranga Biz</span> — Plateforme de distribution
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ChevronRight className="h-3 w-3" /> {store.company.name}
          </div>
        </div>
      </footer>

      {/* ── QR Code WhatsApp Modal ── */}
      {showQR && qrProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">QR Code WhatsApp</h3>
              <button onClick={() => setShowQR(false)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Scannez ce QR code pour commander <span className="font-semibold text-gray-700">{qrProduct.name}</span> sur WhatsApp.
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <QRCode
                  value={buildWhatsAppUrl(qrProduct, whatsappNumber)}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#16a34a"
                  level="H"
                />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400">{formatCFA(qrProduct.price)}</p>
              <p className="text-[10px] text-gray-400">{qrProduct.reference}</p>
            </div>
            <a
              href={buildWhatsAppUrl(qrProduct, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Commander sur WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
