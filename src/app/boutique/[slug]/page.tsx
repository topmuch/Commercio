'use client'

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import {
  ShoppingCart,
  Star,
  Search,
  MessageCircle,
  Phone,
  MapPin,
  ArrowLeft,
  PackageX,
  QrCode,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Store,
  Tag,
  Layers,
  ChevronRight,
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

interface CartItem {
  product: Product
  quantity: number
}

type StockStatus = 'en_stock' | 'stock_limite' | 'rupture'

// ── Cart Context ─────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { product, quantity }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

// ── Helpers ───────────────────────────────────────────────────────

function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' CFA'
}

function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock === 0) return 'rupture'
  if (stock <= minStock) return 'stock_limite'
  return 'en_stock'
}

function getStockBadge(stock: number, minStock: number) {
  const status = getStockStatus(stock, minStock)
  switch (status) {
    case 'rupture':
      return (
        <Badge className="text-[10px] px-1.5 py-0 bg-red-500 text-white border-0 font-medium">
          Rupture
        </Badge>
      )
    case 'stock_limite':
      return (
        <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white border-0 font-medium">
          Stock limité
        </Badge>
      )
    case 'en_stock':
      return (
        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500 text-white border-0 font-medium">
          En stock
        </Badge>
      )
  }
}

function getStockLabel(stock: number, minStock: number): string {
  const status = getStockStatus(stock, minStock)
  switch (status) {
    case 'rupture': return 'Rupture de stock'
    case 'stock_limite': return `Stock limité — ${stock} restant${stock > 1 ? 's' : ''}`
    case 'en_stock': return `${stock} en stock`
  }
}

function getStockColor(stock: number, minStock: number): string {
  const status = getStockStatus(stock, minStock)
  switch (status) {
    case 'rupture': return 'text-red-600'
    case 'stock_limite': return 'text-amber-600'
    case 'en_stock': return 'text-emerald-600'
  }
}

function cleanPhone(phone: string | null): string {
  return phone ? phone.replace(/[^0-9]/g, '') : ''
}

function buildWhatsAppUrl(phone: string | null, message: string): string {
  const clean = cleanPhone(phone)
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

function buildProductMessage(product: Product, quantity = 1): string {
  const qtyStr = quantity > 1 ? `\n🛒 Quantité : ${quantity}` : ''
  return (
    `Bonjour, je souhaite commander :\n\n` +
    `📦 Produit : ${product.name}\n` +
    `📋 Référence : ${product.reference}\n` +
    `💰 Prix : ${formatCFA(product.price)}\n` +
    `${product.resellerPrice ? `🏷️ Prix revendeur : ${formatCFA(product.resellerPrice)}\n` : ''}` +
    `${qtyStr}\n\n` +
    `Merci de confirmer la disponibilité.`
  )
}

function buildCartMessage(items: CartItem[]): string {
  if (items.length === 0) return ''
  let msg = `Bonjour, je souhaite commander :\n\n`
  let total = 0
  items.forEach((item, idx) => {
    const subtotal = item.product.price * item.quantity
    total += subtotal
    msg += `${idx + 1}. ${item.product.name} (×${item.quantity}) — ${formatCFA(subtotal)}\n`
    msg += `   Réf: ${item.product.reference}\n`
  })
  msg += `\n💰 Total : ${formatCFA(total)}\n\nMerci de confirmer la disponibilité.`
  return msg
}

const gradients = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-cyan-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
  'from-red-400 to-rose-500',
  'from-fuchsia-400 to-pink-500',
  'from-teal-400 to-emerald-500',
  'from-yellow-400 to-amber-500',
  'from-orange-400 to-red-500',
  'from-cyan-400 to-sky-500',
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

// ── Product Card ───────────────────────────────────────────────────

function ProductCard({
  product,
  whatsappNumber,
  idx,
  onClick,
}: {
  product: Product
  whatsappNumber: string
  idx: number
  onClick: (product: Product) => void
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const waUrl = buildWhatsAppUrl(
    whatsappNumber,
    buildProductMessage(product)
  )

  return (
    <Card
      className="group overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full cursor-pointer bg-white"
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
      {/* Image area */}
      <div
        className={`relative h-48 bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center overflow-hidden`}
      >
        <div className="text-white/20 text-7xl font-bold select-none transition-transform duration-500 group-hover:scale-110">
          {product.name.charAt(0)}
        </div>
        {product.brand && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/25 text-white text-[10px] px-2 py-0.5 backdrop-blur-sm border-0 font-medium">
              <Tag className="h-3 w-3 mr-0.5" />
              {product.brand}
            </Badge>
          </div>
        )}
        <div className="absolute top-3 right-3">
          {getStockBadge(product.stock, product.minStock)}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>

      <CardContent className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="min-h-0">
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 text-sm">
            {product.name}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {product.reference}
            {product.category && (
              <span className="text-gray-400"> · {product.category.name}</span>
            )}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-lg font-bold text-gray-900 block">
            {formatCFA(product.price)}
          </span>
          {product.resellerPrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">
                Revendeur
              </span>
              <span className="text-xs font-semibold text-orange-600">
                {formatCFA(product.resellerPrice)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 flex gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium py-2.5 px-3 rounded-lg transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Commander ${product.name} sur WhatsApp`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Commander
          </a>
          <button
            onClick={handleAddToCart}
            className={`shrink-0 inline-flex items-center justify-center gap-1.5 h-[38px] px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              added
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
            }`}
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {added ? '✓' : ''}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Product Card Skeleton ──────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-100">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-6 w-1/3 rounded" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Product Detail Modal ─────────────────────────────────────────

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
  const [showQR, setShowQR] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  if (!product) return null

  const cartItem = items.find((i) => i.product.id === product.id)
  const currentQuantity = cartItem ? cartItem.quantity : 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
    setQuantity(1)
  }

  const waUrl = buildWhatsAppUrl(
    whatsappNumber,
    buildProductMessage(product, quantity)
  )

  const isOutOfStock = product.stock === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 sm:max-w-md">
        <div className="relative">
          {/* Product image area */}
          <div className="h-56 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center relative">
            <div className="text-white/20 text-8xl font-bold select-none">
              {product.name.charAt(0)}
            </div>
            {product.brand && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/25 text-white text-xs px-2.5 py-1 backdrop-blur-sm border-0 font-medium">
                  <Tag className="h-3 w-3 mr-1" />
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
                <span className="flex items-center gap-0.5">
                  <Layers className="h-3 w-3" />
                  {product.reference}
                </span>
                {product.category && (
                  <span className="flex items-center gap-0.5">
                    <ChevronRight className="h-3 w-3" />
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

            {/* Prices */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Prix public</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCFA(product.price)}
                </span>
              </div>
              {product.resellerPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-500 font-medium uppercase tracking-wider">
                    Prix revendeur
                  </span>
                  <span className="text-base font-bold text-orange-600">
                    {formatCFA(product.resellerPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Stock info */}
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

            {/* QR Code section */}
            <div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                {showQR ? 'Masquer le QR Code' : 'Afficher le QR Code WhatsApp'}
              </button>
              {showQR && (
                <div className="mt-3 flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
                  <QRCode
                    value={waUrl}
                    size={180}
                    bgColor="#FFFFFF"
                    fgColor="#059669"
                    level="H"
                  />
                  <p className="text-xs text-gray-400 text-center">
                    Scannez pour commander {product.name}
                  </p>
                </div>
              )}
            </div>

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
                      Ajouté au panier ! ({currentQuantity + quantity} au total)
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
                    Commander maintenant
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

// ── Cart Sheet ───────────────────────────────────────────────────

function CartSheet({
  open,
  onOpenChange,
  whatsappNumber,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  whatsappNumber: string
}) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } =
    useCart()

  const handleOrderAll = () => {
    if (items.length === 0) return
    const message = buildCartMessage(items)
    const url = buildWhatsAppUrl(whatsappNumber, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    clearCart()
    onOpenChange(false)
  }

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
            Vos articles sélectionnés pour la commande
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-7 w-7 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Votre panier est vide
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ajoutez des produits pour commander
              </p>
            </div>
            <Button
              variant="outline"
              className="text-sm mt-2"
              onClick={() => onOpenChange(false)}
            >
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
                    {/* Mini gradient image */}
                    <div className="shrink-0 h-14 w-14 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <span className="text-white/30 text-xl font-bold">
                        {item.product.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCFA(item.product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-md"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
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
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
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
                        {formatCFA(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="border-t border-gray-100 px-5 pt-4 pb-5 space-y-3">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Total ({totalItems} article{totalItems > 1 ? 's' : ''})
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCFA(totalPrice)}
                </span>
              </div>
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-3 rounded-xl"
                onClick={handleOrderAll}
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

// ── Loading State ─────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Hero skeleton */}
        <Skeleton className="h-52 sm:h-60 lg:h-64 w-full rounded-2xl" />

        {/* Category chips skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />
          ))}
        </div>

        {/* Section header skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>

      {/* Footer CTA skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>

      {/* Footer skeleton */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </footer>
    </div>
  )
}

// ── Error State (with retry) ────────────────────────────────────────

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
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Oups, une erreur est survenue
        </h2>
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

// ── Store Not Found State ────────────────────────────────────────

function NotFoundState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-100 mb-4">
          <PackageX className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Boutique introuvable
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{error}</p>
        <Button
          variant="ghost"
          className="gap-2 text-emerald-600 hover:text-emerald-700"
          asChild
        >
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </a>
        </Button>
      </div>
    </div>
  )
}

// ── Boutique Content (wrapped in CartProvider) ────────────────────

function BoutiqueContent() {
  const params = useParams()
  const slug = params.slug as string

  const [store, setStore] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [notFoundError, setNotFoundError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const { totalItems } = useCart()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setIsNetworkError(false)
      setNotFoundError(null)
      const res = await fetch(`/api/store/${slug}`)
      const json = await res.json()
      if (!res.ok) {
        setNotFoundError(json.error || 'Boutique introuvable ou désactivée')
        return
      }
      const data = json.data
      setStore(data.store)
      setProducts(data.products || [])
      setCategories(data.categories || [])
    } catch {
      setIsNetworkError(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Category navigation data
  const categoryNav = useMemo(() => {
    const nav = [
      { id: 'all', label: 'Tous', icon: '🛍️', count: products.length },
    ]
    categories.forEach((cat) => {
      const count = products.filter((p) => p.category?.name === cat.name).length
      if (count > 0) {
        nav.push({
          id: cat.id,
          label: cat.name,
          icon: categoryIcons[cat.name] || '📦',
          count,
        })
      }
    })
    return nav
  }, [categories, products])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch =
        activeCategory === 'all' ||
        categories.find((c) => c.id === activeCategory)?.name ===
          p.category?.name
      const searchMatch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category?.name &&
          p.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return catMatch && searchMatch
    })
  }, [products, activeCategory, searchQuery, categories])

  // Featured products (top 4 by stock, only when "Tous" + no search)
  const featuredProducts = useMemo(
    () =>
      [...products]
        .filter((p) => p.stock > 0)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 4),
    [products]
  )

  const showFeatured =
    activeCategory === 'all' && !searchQuery && featuredProducts.length > 0

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
  }, [])

  // ─── Loading State ───
  if (loading) {
    return <LoadingState />
  }

  // ─── Network Error (with retry) ───
  if (isNetworkError) {
    return (
      <ErrorState
        message="Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer."
        onRetry={fetchData}
      />
    )
  }

  // ─── Not Found ───
  if (notFoundError || !store) {
    return <NotFoundState error={notFoundError || "Cette boutique n'existe pas ou a été désactivée."} />
  }

  const whatsappNumber = store.whatsappNumber || ''
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Store name */}
          <div className="flex items-center gap-3 min-w-0">
            {store.company.logo ? (
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
              <p className="text-[11px] text-gray-500 truncate">
                {store.company.name}
              </p>
            </div>
          </div>

          {/* Right: Cart + WhatsApp */}
          <div className="flex items-center gap-2">
            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label={`Ouvrir le panier (${totalItems} articles)`}
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* WhatsApp button - hidden on very small screens */}
            <Button
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium shadow-sm hidden sm:inline-flex"
              size="sm"
              asChild
            >
              <a
                href={`https://wa.me/${cleanPhone(whatsappNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contact
              </a>
            </Button>

            {/* WhatsApp icon - shown on mobile */}
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm sm:hidden"
              size="icon"
              asChild
            >
              <a
                href={`https://wa.me/${cleanPhone(whatsappNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacter sur WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8 flex-1">
        {/* ── Hero Banner ── */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
          {/* Decorative circles */}
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -right-6 top-24 h-28 w-28 rounded-full bg-amber-400/20" />
          <div className="absolute right-20 -bottom-8 h-20 w-20 rounded-full bg-white/5" />

          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-3">
              <Store className="h-5 w-5 text-amber-300" />
              <Badge className="bg-amber-400/90 text-amber-950 border-0 text-xs font-medium">
                Boutique en ligne
              </Badge>
              <Badge className="bg-white/15 text-white/90 border-white/20 text-xs font-medium ml-1">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
              {store.title}
            </h2>
            <p className="text-sm sm:text-base text-white/75 mb-5 max-w-lg leading-relaxed">
              {store.description ||
                `Découvrez notre catalogue de ${products.length} produits et commandez facilement via WhatsApp.`}
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Rechercher un produit, marque, catégorie..."
                className="pl-10 h-11 bg-white text-gray-900 placeholder:text-gray-400 border-0 shadow-lg focus-visible:ring-amber-300/50 text-sm rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher un produit"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Category Navigation ── */}
        {categoryNav.length > 1 && (
          <nav aria-label="Catégories de produits">
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {categoryNav.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={activeCategory === cat.id}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] ${
                      activeCategory === cat.id
                        ? 'text-white/70'
                        : 'text-gray-400'
                    }`}
                  >
                    ({cat.count})
                  </span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* ── Featured Products ── */}
        {showFeatured && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
              <h3 className="text-lg font-bold text-gray-900">
                Produits Populaires
              </h3>
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 text-xs border-amber-200"
              >
                {featuredProducts.length} articles
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={whatsappNumber}
                  idx={products.findIndex((p) => p.id === product.id)}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── All Products / Filtered Products ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">
                {searchQuery
                  ? 'Résultats de recherche'
                  : activeCategory === 'all'
                    ? 'Tous les produits'
                    : categoryNav.find((c) => c.id === activeCategory)?.label}
              </h3>
              <Badge
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-600"
              >
                {filteredProducts.length} article
                {filteredProducts.length > 1 ? 's' : ''}
              </Badge>
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-gray-500 text-xs gap-1"
              >
                <X className="h-3 w-3" />
                Effacer
              </Button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="border-dashed border-gray-300 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 font-medium">
                  Aucun produit trouvé
                </p>
                {searchQuery && (
                  <p className="text-xs text-gray-400">
                    Essayez un autre terme de recherche
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={whatsappNumber}
                  idx={products.findIndex((p) => p.id === product.id)}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ═══════ FOOTER CTA ═══════ */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Phone className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="font-semibold text-gray-900">
              Besoin d&apos;aide pour commander ?
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Contactez notre équipe directement via WhatsApp pour une
              assistance personnalisée.
            </p>
            {store.company.address && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="h-3 w-3" />
                {store.company.address}
              </p>
            )}
          </div>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shrink-0 font-medium shadow-sm"
            asChild
          >
            <a
              href={`https://wa.me/${cleanPhone(whatsappNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Contacter sur WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          </Button>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="mt-auto border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Propulsé par{' '}
            <span className="font-semibold text-gray-600">Teranga Biz</span> —
            Plateforme de distribution
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ChevronRight className="h-3 w-3" />
            {store.company.name} · © {currentYear}
          </div>
        </div>
      </footer>

      {/* ═══════ PRODUCT DETAIL MODAL ═══════ */}
      <ProductDetailModal
        key={selectedProduct?.id ?? 'none'}
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        whatsappNumber={whatsappNumber}
      />

      {/* ═══════ CART SHEET ═══════ */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        whatsappNumber={whatsappNumber}
      />
    </div>
  )
}

// ── Main Page (entry point) ───────────────────────────────────────

export default function PublicBoutiquePage() {
  return (
    <CartProvider>
      <BoutiqueContent />
    </CartProvider>
  )
}
