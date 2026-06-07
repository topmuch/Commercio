'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { CartProvider, useCart, type CartItem, type Product } from '@/lib/cart-context'
import {
  ShoppingCart,
  MessageCircle,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Search,
  PackageX,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Tag,
  X,
  ChevronRight,
  Store,
  Send,
  Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

interface StoreInfo {
  title: string
  description: string | null
  whatsappNumber: string | null
  currency: string
  logoUrl: string | null
  primaryColor: string | null
  company: {
    id: string
    name: string
    logo: string | null
    address: string | null
    phone: string | null
  }
}

interface Banner {
  id: string
  imageUrl: string
  title: string | null
  subtitle: string | null
  linkUrl: string | null
  displayOrder: number
}

interface CategoryItem {
  id: string
  name: string
  _count: { products: number }
}

// ── Helpers ───────────────────────────────────────────────────────

function formatFCFA(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA'
}

function cleanPhone(phone: string | null): string {
  return phone ? phone.replace(/[^0-9]/g, '') : ''
}

function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

function getStockStatus(stock: number, minStock?: number): 'en_stock' | 'stock_limite' | 'rupture' {
  const threshold = minStock ?? 5
  if (stock === 0) return 'rupture'
  if (stock <= threshold) return 'stock_limite'
  return 'en_stock'
}

function getStockBadge(stock: number, minStock?: number) {
  const status = getStockStatus(stock, minStock)
  if (status === 'rupture') {
    return <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white border-0 font-medium">Rupture</Badge>
  }
  if (status === 'stock_limite') {
    return <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white border-0 font-medium">Stock limité</Badge>
  }
  return <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500 text-white border-0 font-medium">En stock</Badge>
}

function getStockLabel(stock: number, minStock?: number): string {
  const status = getStockStatus(stock, minStock)
  if (status === 'rupture') return 'Rupture de stock'
  if (status === 'stock_limite') return `Stock limité — ${stock} restant${stock > 1 ? 's' : ''}`
  return `${stock} en stock`
}

function getStockColor(stock: number, minStock?: number): string {
  const status = getStockStatus(stock, minStock)
  if (status === 'rupture') return 'text-red-600'
  if (status === 'stock_limite') return 'text-amber-600'
  return 'text-emerald-600'
}

function buildCheckoutMessage(items: CartItem[], clientName: string, clientPhone: string, storeTitle: string): string {
  let msg = `🛒 *NOUVELLE COMMANDE - ${storeTitle}*\n\n`
  msg += `👤 Client : ${clientName}\n`
  msg += `📞 Téléphone : ${clientPhone}\n\n`
  msg += `📦 *Détail de la commande :*\n\n`
  let total = 0
  items.forEach((item, idx) => {
    const subtotal = item.product.price * item.quantity
    total += subtotal
    msg += `${idx + 1}. ${item.product.name}\n`
    msg += `   Quantité : ${item.quantity}\n`
    msg += `   Prix unitaire : ${formatFCFA(item.product.price)}\n`
    msg += `   Sous-total : ${formatFCFA(subtotal)}\n\n`
  })
  msg += `─────────────────\n`
  msg += `💰 *TOTAL : ${formatFCFA(total)}*\n`
  msg += `─────────────────\n\n`
  msg += `Merci de confirmer ma commande.`
  return msg
}

const placeholderGradients = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-cyan-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
  'from-red-400 to-rose-500',
  'from-fuchsia-400 to-pink-500',
]

// ══════════════════════════════════════════════════════════════════
// ── PROMOTION SLIDER ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function PromotionSlider({ banners }: { banners: Banner[] }) {
  if (!banners || banners.length === 0) return null

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-4">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={12}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={banners.length > 1}
        className="rounded-2xl overflow-hidden shadow-md"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72">
              <Image
                src={banner.imageUrl}
                alt={banner.title || 'Promotion'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
                unoptimized
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                {banner.title && (
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="text-sm sm:text-base text-white/90 mt-1 drop-shadow">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── PRODUCT CARD ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function ProductCard({
  product,
  idx,
  onClick,
  onAdd,
}: {
  product: Product
  idx: number
  onClick: (product: Product) => void
  onAdd: (product: Product) => void
}) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAdd(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -4px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group overflow-hidden border border-gray-200 flex flex-col h-full cursor-pointer bg-white transition-all duration-300 rounded-xl"
        onClick={() => onClick(product)}
        role="button"
        tabIndex={0}
        aria-label={`Voir les détails de ${product.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(product)
          }
        }}
      >
        {/* Image or placeholder */}
        <div className="relative h-44 sm:h-48 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${placeholderGradients[idx % placeholderGradients.length]} flex items-center justify-center`}>
              <span className="text-white/20 text-7xl font-bold select-none">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          {/* Brand badge */}
          {product.brand && (
            <div className="absolute top-2.5 left-2.5">
              <Badge className="bg-black/30 text-white text-[10px] px-2 py-0.5 backdrop-blur-sm border-0 font-medium">
                {product.brand}
              </Badge>
            </div>
          )}
          {/* Stock badge */}
          <div className="absolute top-2.5 right-2.5">
            {getStockBadge(product.stock, product.minStock)}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
        </div>

        <CardContent className="flex flex-col flex-1 p-3.5 gap-2">
          <div className="min-h-0">
            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 text-sm">
              {product.name}
            </h3>
            {product.category && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {product.category.name}
              </p>
            )}
          </div>

          <span className="text-base font-bold text-gray-900">
            {formatFCFA(product.price)}
          </span>

          <div className="mt-auto pt-1.5">
            <Button
              className={`w-full gap-1.5 text-xs font-medium py-2.5 rounded-lg transition-all duration-200 ${
                added
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
              } ${product.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {added ? (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Ajouté ✓
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── PRODUCT DETAIL MODAL ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function ProductDetailModal({
  product,
  open,
  onOpenChange,
  whatsappNumber,
}: {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  whatsappNumber: string
}) {
  const { addItem, items } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  if (!product) return null

  const cartItem = items.find((i) => i.product.id === product.id)
  const currentInCart = cartItem ? cartItem.quantity : 0
  const isOutOfStock = product.stock === 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
    setQuantity(1)
  }

  const waMessage = `Bonjour, je souhaite commander :\n\n📦 Produit : ${product.name}\n💰 Prix : ${formatFCFA(product.price)}\n🛒 Quantité : ${quantity}\n\nMerci de confirmer la disponibilité.`
  const waUrl = buildWhatsAppUrl(whatsappNumber, waMessage)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 sm:max-w-md rounded-xl">
        <div className="relative">
          {/* Product image */}
          <div className="h-56 relative overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-white/20 text-8xl font-bold select-none">
                  {product.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {product.brand && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/30 text-white text-xs px-2.5 py-1 backdrop-blur-sm border-0 font-medium">
                  {product.brand}
                </Badge>
              </div>
            )}
            <div className="absolute top-4 right-4">
              {getStockBadge(product.stock, product.minStock)}
            </div>
          </div>

          {/* Product details */}
          <div className="p-5 space-y-4">
            <DialogHeader className="space-y-1 text-left px-0">
              <DialogTitle className="text-xl text-gray-900">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                {product.category && (
                  <span className="flex items-center gap-0.5">
                    <Tag className="h-3 w-3" />
                    {product.category.name}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Prix</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatFCFA(product.price)}
                </span>
              </div>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getStockColor(product.stock, product.minStock)}`}>
                {getStockLabel(product.stock, product.minStock)}
              </span>
            </div>

            {/* Quantity selector */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <span className="text-sm font-medium text-gray-700">Quantité</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-lg font-semibold text-gray-900 w-8 text-center tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              {!isOutOfStock && (
                <Button
                  className={`w-full gap-2 text-sm font-medium py-3 rounded-xl transition-all duration-300 ${
                    addedToCart
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                  }`}
                  onClick={handleAddToCart}
                >
                  {addedToCart ? (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Ajouté au panier ! ({currentInCart + quantity} au total)
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Ajouter au panier
                    </>
                  )}
                </Button>
              )}
              <Button
                className={`w-full gap-2 text-sm font-medium py-3 rounded-xl ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                }`}
                asChild={!isOutOfStock}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Produit en rupture
                  </>
                ) : (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Commander sur WhatsApp
                  </a>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── CHECKOUT MODAL ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function CheckoutModal({
  open,
  onOpenChange,
  whatsappNumber,
  storeTitle,
  slug,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  whatsappNumber: string
  storeTitle: string
  slug: string
}) {
  const { items, totalPrice, clearCart } = useCart()
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setClientName('')
      setClientPhone('')
      setErrors({})
      setSending(false)
    }
  }, [open])

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {}
    if (!clientName.trim()) {
      newErrors.name = 'Le nom est requis'
    }
    const phoneDigits = clientPhone.replace(/\s/g, '')
    if (!phoneDigits) {
      newErrors.phone = 'Le téléphone est requis'
    } else if (!/^(\+221|221)?[0-9]{9}$/.test(phoneDigits)) {
      newErrors.phone = 'Format : +221 XX XXX XX XX'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || items.length === 0) return

    setSending(true)
    try {
      const message = buildCheckoutMessage(items, clientName.trim(), clientPhone.trim(), storeTitle)

      // Save order to database
      await fetch('/api/whatsapp-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
          totalAmount: totalPrice,
        }),
      })

      // Open WhatsApp
      const waUrl = buildWhatsAppUrl(whatsappNumber, message)
      window.open(waUrl, '_blank', 'noopener,noreferrer')

      clearCart()
      onOpenChange(false)
    } catch {
      // Still open WhatsApp even if saving fails
      const message = buildCheckoutMessage(items, clientName.trim(), clientPhone.trim(), storeTitle)
      const waUrl = buildWhatsAppUrl(whatsappNumber, message)
      window.open(waUrl, '_blank', 'noopener,noreferrer')
      clearCart()
      onOpenChange(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5 text-emerald-600" />
            Finaliser la commande
          </DialogTitle>
          <DialogDescription>
            Remplissez vos informations pour envoyer la commande par WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Client name */}
          <div className="space-y-1.5">
            <label htmlFor="checkout-name" className="text-sm font-medium text-gray-700">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <Input
              id="checkout-name"
              placeholder="Votre nom"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              className={errors.name ? 'border-red-400' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Client phone */}
          <div className="space-y-1.5">
            <label htmlFor="checkout-phone" className="text-sm font-medium text-gray-700">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <Input
              id="checkout-phone"
              placeholder="+221 7X XXX XX XX"
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value)
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
              }}
              className={errors.phone ? 'border-red-400' : ''}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Résumé ({items.length} article{items.length > 1 ? 's' : ''})
            </h4>
            <ScrollArea className="max-h-40">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                    {item.product.name} ×{item.quantity}
                  </span>
                  <span className="text-gray-900 font-medium whitespace-nowrap">
                    {formatFCFA(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </ScrollArea>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-700">Total</span>
              <span className="text-sm font-bold text-emerald-600">{formatFCFA(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={handleSubmit}
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── CART DRAWER (SHEET) ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function CartDrawer({
  open,
  onOpenChange,
  onCheckout,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
}) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } =
    useCart()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            Mon Panier
            {totalItems > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs ml-1">
                {totalItems}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-500">
            Vos articles sélectionnés
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-7 w-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Votre panier est vide</p>
              <p className="text-xs text-gray-400 mt-1">
                Ajoutez des produits pour commencer
              </p>
            </div>
            <Button variant="outline" className="text-sm mt-2" onClick={() => onOpenChange(false)}>
              Continuer mes achats
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-5 py-3">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    {/* Mini image */}
                    <div className="shrink-0 h-14 w-14 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          width={56}
                          height={56}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-white/30 text-xl font-bold">
                          {item.product.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatFCFA(item.product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          aria-label="Diminuer"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium text-gray-900 w-6 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          aria-label="Augmenter"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-auto h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Retirer ${item.product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatFCFA(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="border-t border-gray-100 px-5 pt-4 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Total ({totalItems} article{totalItems > 1 ? 's' : ''})
                </span>
                <span className="text-lg font-bold text-gray-900">{formatFCFA(totalPrice)}</span>
              </div>
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-3 rounded-xl"
                onClick={onCheckout}
              >
                <MessageCircle className="h-4 w-4" />
                Commander sur WhatsApp
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500 text-xs"
                onClick={clearCart}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Vider le panier
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── FLOATING WHATSAPP BUTTON ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function FloatingWhatsApp({ whatsappNumber, storeTitle }: { whatsappNumber: string; storeTitle: string }) {
  const message = `Bonjour, je souhaite des informations sur vos produits chez ${storeTitle}.`
  const waUrl = buildWhatsAppUrl(whatsappNumber, message)

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] hover:scale-110 active:scale-95 transition-all duration-200"
      aria-label="Contacter sur WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── LOADING SKELETON ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Banner skeleton */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>

      {/* Search skeleton */}
      <div className="max-w-6xl mx-auto px-4 mt-5">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-gray-100">
              <Skeleton className="h-44 w-full" />
              <CardContent className="p-3.5 space-y-2.5">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-5 w-1/3 rounded" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── ERROR & NOT FOUND STATES ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Oups, une erreur est survenue</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button variant="ghost" className="gap-2 text-gray-500" asChild>
            <a href="/">
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function NotFoundState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-100 mb-4">
          <PackageX className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Boutique introuvable</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{error}</p>
        <Button variant="ghost" className="gap-2 text-emerald-600 hover:text-emerald-700" asChild>
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </a>
        </Button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── EMPTY STATE ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function EmptyState({ whatsappNumber, storeTitle }: { whatsappNumber: string; storeTitle: string }) {
  const message = `Bonjour, je souhaite des informations sur vos produits chez ${storeTitle}.`
  const waUrl = buildWhatsAppUrl(whatsappNumber, message)

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-5">
        <Store className="h-9 w-9 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun produit disponible</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        Cette boutique n&apos;a pas encore de produits. Contactez-nous directement pour en savoir plus.
      </p>
      <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          Contactez-nous sur WhatsApp
        </a>
      </Button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── BOUTIQUE CONTENT ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

function BoutiqueContent() {
  const params = useParams()
  const slug = params.slug as string

  const [store, setStore] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [notFoundError, setNotFoundError] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const { addItem, totalItems } = useCart()

  // Fetch store data and banners
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setIsNetworkError(false)
      setNotFoundError(null)

      const [storeRes, bannersRes] = await Promise.all([
        fetch(`/api/store/${slug}`),
        fetch(`/api/store/banners?slug=${encodeURIComponent(slug)}`),
      ])

      if (!storeRes.ok) {
        const json = await storeRes.json()
        setNotFoundError(json.error || 'Boutique introuvable ou désactivée')
        return
      }

      const storeJson = await storeRes.json()
      const data = storeJson.data
      setStore(data.store)
      setProducts(data.products || [])

      if (bannersRes.ok) {
        const bannersJson = await bannersRes.json()
        setBanners(bannersJson.data || [])
      }
    } catch {
      setIsNetworkError(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
        p.reference.toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
  }, [])

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (product.stock > 0) {
        addItem(product)
      }
    },
    [addItem]
  )

  const handleOpenCart = useCallback(() => {
    setCartOpen(true)
  }, [])

  const handleOpenCheckout = useCallback(() => {
    setCartOpen(false)
    setTimeout(() => setCheckoutOpen(true), 200)
  }, [])

  // ─── Loading ───
  if (loading) return <LoadingSkeleton />

  // ─── Network Error ───
  if (isNetworkError) {
    return (
      <ErrorState
        message="Erreur de connexion. Vérifiez votre connexion internet et réessayez."
        onRetry={fetchData}
      />
    )
  }

  // ─── Not Found ───
  if (notFoundError || !store) {
    return <NotFoundState error={notFoundError || "Cette boutique n'existe pas ou a été désactivée."} />
  }

  const whatsappNumber = cleanPhone(store.whatsappNumber) || ''
  const hasBanners = banners.length > 0

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo + Store title */}
          <div className="flex items-center gap-3 min-w-0">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.title}
                className="h-10 w-10 rounded-xl object-cover border border-gray-200"
              />
            ) : store.company.logo ? (
              <img
                src={store.company.logo}
                alt={store.company.name}
                className="h-10 w-10 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-sm">
                {store.title.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                {store.title}
              </h1>
              <p className="text-[11px] text-gray-500 truncate hidden sm:block">
                {store.company.name}
              </p>
            </div>
          </div>

          {/* Cart + WhatsApp */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCart}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label={`Ouvrir le panier (${totalItems} articles)`}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium shadow-sm transition-colors"
                aria-label="Contacter sur WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contact
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ═══════ MAIN ═══════ */}
      <main className="flex-1 bg-gray-50">
        {/* Promotion Slider */}
        <div className="bg-white pb-2">
          <AnimatePresence>
            {hasBanners && <PromotionSlider banners={banners} />}
          </AnimatePresence>

          {/* Store description (if no banners) */}
          {!hasBanners && store.description && (
            <div className="max-w-6xl mx-auto px-4 mt-5">
              <p className="text-sm text-gray-600 leading-relaxed">{store.description}</p>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Products section */}
        <div className="max-w-6xl mx-auto px-4 mt-5 pb-8">
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Nos Produits</h2>
              <Badge variant="secondary" className="text-xs">
                {filteredProducts.length}
              </Badge>
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500">
                Résultats pour &quot;{searchQuery}&quot;
              </p>
            )}
          </div>

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  idx={idx}
                  onClick={handleProductClick}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-600">Aucun résultat</p>
              <p className="text-xs text-gray-400 mt-1">
                Essayez avec d&apos;autres mots-clés
              </p>
            </div>
          ) : (
            <EmptyState whatsappNumber={whatsappNumber} storeTitle={store.title} />
          )}
        </div>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {store.company.name} — Propulsé par Teranga Biz
          </p>
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <MessageCircle className="h-3 w-3" />
              Contact
            </a>
          )}
        </div>
      </footer>

      {/* ═══════ FLOATING WHATSAPP ═══════ */}
      {whatsappNumber && (
        <FloatingWhatsApp whatsappNumber={whatsappNumber} storeTitle={store.title} />
      )}

      {/* ═══════ PRODUCT DETAIL MODAL ═══════ */}
      <ProductDetailModal
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        whatsappNumber={whatsappNumber}
      />

      {/* ═══════ CART DRAWER ═══════ */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={handleOpenCheckout}
      />

      {/* ═══════ CHECKOUT MODAL ═══════ */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        whatsappNumber={whatsappNumber}
        storeTitle={store.title}
        slug={slug}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// ── PAGE EXPORT ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

export default function BoutiquePage() {
  return (
    <CartProvider>
      <BoutiqueContent />
    </CartProvider>
  )
}
