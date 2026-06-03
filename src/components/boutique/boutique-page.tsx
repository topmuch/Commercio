'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  ShoppingCart,
  Star,
  Search,
  MessageCircle,
  Tag,
  Sparkles,
  Phone,
} from 'lucide-react'

// ── Mock data ──────────────────────────────────────────────────────────

interface BoutiqueProduct {
  id: string
  name: string
  reference: string
  price: number
  resellerPrice: number
  stock: number
  minStock: number
  category: string
  isNew: boolean
  isPromo: boolean
  promoPercent?: number
  gradient: string
}

const categories = [
  { id: 'all', label: 'Tous', icon: '🛍️' },
  { id: 'boissons', label: 'Boissons', icon: '🥤' },
  { id: 'alimentation', label: 'Alimentation', icon: '🍞' },
  { id: 'entretien', label: 'Entretien', icon: '🧹' },
  { id: 'cosmetiques', label: 'Cosmétiques', icon: '💄' },
]

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

const allProducts: BoutiqueProduct[] = [
  { id: '1', name: 'Coca-Cola 33cl', reference: 'BOI-001', price: 50, resellerPrice: 42, stock: 500, minStock: 50, category: 'boissons', isNew: false, isPromo: true, promoPercent: 10, gradient: gradients[0] },
  { id: '2', name: 'Yaourt Danone Pack 12', reference: 'ALI-001', price: 650, resellerPrice: 580, stock: 200, minStock: 30, category: 'alimentation', isNew: false, isPromo: false, gradient: gradients[1] },
  { id: '3', name: 'Détergent Tide 3kg', reference: 'ENT-001', price: 1200, resellerPrice: 1050, stock: 80, minStock: 20, category: 'entretien', isNew: true, isPromo: false, gradient: gradients[2] },
  { id: '4', name: 'Shampoo Dove 400ml', reference: 'COS-001', price: 450, resellerPrice: 380, stock: 150, minStock: 25, category: 'cosmetiques', isNew: false, isPromo: false, gradient: gradients[3] },
  { id: '5', name: 'Jus d\'Orange Al Hamra 1L', reference: 'BOI-002', price: 180, resellerPrice: 155, stock: 0, minStock: 40, category: 'boissons', isNew: false, isPromo: false, gradient: gradients[4] },
  { id: '6', name: 'Semoule Couscous 5kg', reference: 'ALI-002', price: 450, resellerPrice: 390, stock: 300, minStock: 50, category: 'alimentation', isNew: true, isPromo: true, promoPercent: 15, gradient: gradients[5] },
  { id: '7', name: 'Eau Javel 1L', reference: 'ENT-002', price: 80, resellerPrice: 65, stock: 15, minStock: 30, category: 'entretien', isNew: false, isPromo: false, gradient: gradients[6] },
  { id: '8', name: 'Crème Nivea 200ml', reference: 'COS-002', price: 520, resellerPrice: 460, stock: 90, minStock: 15, category: 'cosmetiques', isNew: true, isPromo: false, gradient: gradients[7] },
  { id: '9', name: 'Harissa CPL 70g x24', reference: 'ALI-003', price: 800, resellerPrice: 720, stock: 120, minStock: 20, category: 'alimentation', isNew: false, isPromo: true, promoPercent: 8, gradient: gradients[8] },
  { id: '10', name: 'Sprite 33cl', reference: 'BOI-003', price: 50, resellerPrice: 42, stock: 400, minStock: 50, category: 'boissons', isNew: false, isPromo: false, gradient: gradients[9] },
  { id: '11', name: 'Savon de Marseille 500g', reference: 'ENT-003', price: 250, resellerPrice: 210, stock: 60, minStock: 15, category: 'entretien', isNew: false, isPromo: false, gradient: gradients[10] },
  { id: '12', name: 'Gel Douche Palmolive', reference: 'COS-003', price: 380, resellerPrice: 330, stock: 110, minStock: 20, category: 'cosmetiques', isNew: true, isPromo: false, gradient: gradients[11] },
]

// ── Helpers ───────────────────────────────────────────────────────────

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' CFA'
}

function getStockBadge(stock: number, minStock: number) {
  if (stock === 0) {
    return <Badge variant="destructive" className="text-[10px] px-1.5">Rupture</Badge>
  }
  if (stock <= minStock) {
    return <Badge className="text-[10px] px-1.5 bg-erp-warning text-white">Stock limité</Badge>
  }
  return <Badge className="text-[10px] px-1.5 bg-erp-success text-white">En stock</Badge>
}

function buildWhatsAppUrl(product: BoutiqueProduct) {
  const message = encodeURIComponent(
    `Bonjour, je souhaite commander :\n\n` +
    `📦 Produit : ${product.name}\n` +
    `📋 Référence : ${product.reference}\n` +
    `💰 Prix : ${formatCFA(product.price)}\n` +
    `${product.resellerPrice ? `🏷️ Prix revendeur : ${formatCFA(product.resellerPrice)}\n` : ''}` +
    `\nMerci de confirmer la disponibilité.`
  )
  return `https://wa.me/?text=${message}`
}

// ── Product Card ──────────────────────────────────────────────────────

function ProductCard({ product }: { product: BoutiqueProduct }) {
  return (
    <Card className="group overflow-hidden border border-border/60 hover:shadow-lg transition-all duration-200 hover:border-erp-orange/30 flex flex-col">
      {/* Image placeholder */}
      <div className={`relative h-40 bg-gradient-to-br ${product.gradient} flex items-center justify-center overflow-hidden`}>
        <div className="text-white/30 text-6xl font-bold">
          {product.name.charAt(0)}
        </div>

        {/* Badges on image */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isPromo && (
            <Badge className="bg-erp-orange text-white text-[10px] px-1.5 py-0 gap-0.5">
              <Tag className="h-3 w-3" />
              -{product.promoPercent}%
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 gap-0.5">
              <Sparkles className="h-3 w-3" />
              Nouveau
            </Badge>
          )}
        </div>

        <div className="absolute top-2 right-2">
          {getStockBadge(product.stock, product.minStock)}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200" />
      </div>

      <CardContent className="flex flex-col flex-1 p-4 gap-3">
        {/* Name + Ref */}
        <div>
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Réf: {product.reference}
          </p>
        </div>

        {/* Prices */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatCFA(product.price)}
            </span>
            {product.isPromo && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCFA(Math.round(product.price / (1 - (product.promoPercent || 0) / 100)))}
              </span>
            )}
          </div>
          {product.resellerPrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Prix revendeur
              </span>
              <span className="text-xs font-semibold text-erp-orange">
                {formatCFA(product.resellerPrice)}
              </span>
            </div>
          )}
        </div>

        {/* WhatsApp button */}
        <div className="mt-auto">
          <Button
            className="w-full gap-2 bg-erp-success hover:bg-erp-success/90 text-white text-sm"
            size="sm"
            asChild
            disabled={product.stock === 0}
          >
            <a href={buildWhatsAppUrl(product)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Commander sur WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function BoutiquePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  const promoProducts = useMemo(
    () => allProducts.filter((p) => p.isPromo),
    []
  )

  const newProducts = useMemo(
    () => allProducts.filter((p) => p.isNew),
    []
  )

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-erp-blue p-6 sm:p-10 lg:p-14">
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-5 top-16 h-24 w-24 rounded-full bg-erp-orange/20" />
        <div className="absolute left-1/2 -bottom-6 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-6 w-6 text-erp-orange" />
            <Badge className="bg-erp-orange/90 text-white border-0">
              Boutique en ligne
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Bienvenue sur notre boutique
          </h1>
          <p className="text-sm sm:text-base text-white/70 mb-6 max-w-lg">
            Parcourez notre catalogue de produits et commandez facilement via WhatsApp.
            Prix compétitifs pour professionnels et revendeurs.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit, une référence..."
              className="pl-10 h-11 bg-white/95 text-foreground placeholder:text-muted-foreground border-0 shadow-lg focus-visible:ring-erp-orange/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── Category Navigation ────────────────────────────── */}
      <section>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* ── Promotions Section ────────────────────────────── */}
      {activeCategory === 'all' && !searchQuery && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-erp-orange" />
            <h2 className="text-lg font-bold text-foreground">Promotions</h2>
            <Badge variant="secondary" className="bg-erp-orange/10 text-erp-orange text-xs">
              {promoProducts.length} articles
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Nouveautés Section ────────────────────────────── */}
      {activeCategory === 'all' && !searchQuery && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Nouveautés</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              {newProducts.length} articles
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Products Grid ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-erp-orange" />
            <h2 className="text-lg font-bold text-foreground">
              {activeCategory === 'all' ? 'Tous les produits' : categories.find(c => c.id === activeCategory)?.label}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {filteredProducts.length} articles
            </Badge>
          </div>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              Effacer la recherche
            </Button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <Search className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aucun produit trouvé pour &ldquo;{searchQuery}&rdquo;
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Voir tous les produits
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer CTA ─────────────────────────────────────── */}
      <section className="rounded-2xl bg-muted/50 border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-erp-success/10">
          <Phone className="h-6 w-6 text-erp-success" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="font-semibold text-foreground">Besoin d&apos;aide pour commander ?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Contactez notre équipe directement via WhatsApp pour une assistance personnalisée.
          </p>
        </div>
        <Button className="gap-2 bg-erp-success hover:bg-erp-success/90 text-white shrink-0">
          <MessageCircle className="h-4 w-4" />
          Contacter sur WhatsApp
        </Button>
      </section>
    </div>
  )
}
