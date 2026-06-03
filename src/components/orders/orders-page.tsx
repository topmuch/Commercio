'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Package,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Order, Client, Product } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────
function formatDA(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' CFA'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ORDER_STATUS_MAP: Record<string, { label: string; className: string }> = {
  new: { label: 'Nouvelle', className: 'bg-blue-100 text-blue-700' },
  validated: { label: 'Validée', className: 'bg-purple-100 text-purple-700' },
  preparation: { label: 'En préparation', className: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: 'Expédiée', className: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Livrée', className: 'bg-green-100 text-green-700' },
}

const STATUS_TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'new', label: 'Nouvelle' },
  { value: 'validated', label: 'Validée' },
  { value: 'preparation', label: 'En préparation' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
]

interface OrderItemRow {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

// ── Component ────────────────────────────────────────────
export default function OrdersPage() {
  // toast imported from sonner

  // Data
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Form
  const [formClientId, setFormClientId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formDiscount, setFormDiscount] = useState(0)
  const [formItems, setFormItems] = useState<OrderItemRow[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0 },
  ])
  const [clientSearch, setClientSearch] = useState('')

  // ── Fetch orders ──
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/orders?${params}`)
      const json = await res.json()
      if (json.data) {
        setOrders(json.data)
        setTotalPages(json.totalPages || 1)
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les commandes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, page, toast])

  // ── Fetch status counts ──
  const fetchCounts = useCallback(async () => {
    try {
      const statuses = ['new', 'validated', 'preparation', 'shipped', 'delivered']
      const countsMap: Record<string, number> = {}
      await Promise.all(
        statuses.map(async (s) => {
          const res = await fetch(`/api/orders?status=${s}&limit=1`)
          const json = await res.json()
          countsMap[s] = json.count || 0
        })
      )
      // Get all count
      const resAll = await fetch('/api/orders?limit=1')
      const jsonAll = await resAll.json()
      countsMap['all'] = jsonAll.count || 0
      setStatusCounts(countsMap)
    } catch {
      // silent
    }
  }, [])

  // ── Fetch clients ──
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients?limit=200')
      const json = await res.json()
      if (json.data) setClients(json.data)
    } catch {
      // silent
    }
  }, [])

  // ── Fetch products ──
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?limit=200')
      const json = await res.json()
      if (json.data) setProducts(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchCounts()
    fetchClients()
    fetchProducts()
  }, [fetchOrders, fetchCounts, fetchClients, fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [activeTab, search])

  // ── Form calculations ──
  const subtotal = formItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const discountAmount = (subtotal * formDiscount) / 100
  const taxAmount = ((subtotal - discountAmount) * 19) / 100
  const total = subtotal - discountAmount + taxAmount

  // ── Item management ──
  const addItem = () => {
    setFormItems([...formItems, { productId: '', productName: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (idx: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== idx))
    }
  }

  const updateItem = (idx: number, field: keyof OrderItemRow, value: string | number) => {
    const updated = [...formItems]
    if (field === 'productId') {
      const product = products.find((p) => p.id === value)
      updated[idx] = {
        ...updated[idx],
        productId: value as string,
        productName: product?.name || '',
        unitPrice: product?.resellerPrice || product?.price || 0,
      }
    } else {
      ;(updated[idx] as Record<string, string | number>)[field] = value
    }
    setFormItems(updated)
  }

  // ── Submit order ──
  const handleSubmit = async () => {
    if (!formClientId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un client', variant: 'destructive' })
      return
    }
    const validItems = formItems.filter((i) => i.productId && i.quantity > 0 && i.unitPrice > 0)
    if (validItems.length === 0) {
      toast({ title: 'Erreur', description: 'Ajoutez au moins un article valide', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formClientId,
          items: validItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          discount: formDiscount,
          tax: 19,
          notes: formNotes || undefined,
        }),
      })
      const json = await res.json()
      if (json.error) {
        toast({ title: 'Erreur', description: json.error, variant: 'destructive' })
      } else {
        toast({ title: 'Succès', description: 'Commande créée avec succès' })
        setDialogOpen(false)
        resetForm()
        fetchOrders()
        fetchCounts()
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormClientId('')
    setFormNotes('')
    setFormDiscount(0)
    setFormItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0 }])
    setClientSearch('')
  }

  // ── Filtered clients for dialog ──
  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.companyName.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.contactName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Commandes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos commandes et suivez leur statut
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle commande
        </Button>
      </div>

      {/* Status Pipeline Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              {tab.label}
              {statusCounts[tab.value] !== undefined && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1.5 text-[10px] font-semibold"
                >
                  {statusCounts[tab.value]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N°, client, commercial..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Commercial</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Articles</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Aucune commande trouvée</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const statusInfo = ORDER_STATUS_MAP[order.status] || {
                      label: order.status,
                      className: 'bg-gray-100 text-gray-700',
                    }
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs font-medium">
                          {order.number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{order.client?.companyName}</p>
                            <p className="text-xs text-muted-foreground">{order.client?.contactName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {order.commercial?.name || '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatDA(order.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center text-sm text-muted-foreground">
                          {order._count?.items || (order.items?.length ?? '—')}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedOrder(order)
                                setDetailOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── New Order Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouvelle commande
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Select */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <div className="relative">
                <Input
                  placeholder="Rechercher un client..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="mb-2"
                />
                <Select value={formClientId} onValueChange={setFormClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <span className="font-medium">{client.companyName}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          — {client.contactName}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Articles *</Label>
              <div className="space-y-3">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <Select
                        value={item.productId}
                        onValueChange={(val) => updateItem(idx, 'productId', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className="font-medium">{p.name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({p.reference}) — {formatDA(p.resellerPrice || p.price)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Qté"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                        }
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Prix unit."
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))
                        }
                      />
                    </div>
                    <div className="w-28 text-right font-medium text-sm py-2">
                      {formatDA(item.quantity * item.unitPrice)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive"
                      onClick={() => removeItem(idx)}
                      disabled={formItems.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter un article
              </Button>
            </div>

            {/* Totals */}
            <Card className="bg-muted/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{formatDA(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-muted-foreground">Remise</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-16 h-7 text-center text-xs"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <span className="font-medium ml-2 text-red-500">-{formatDA(discountAmount)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA (19%)</span>
                  <span className="font-medium">{formatDA(taxAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatDA(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes internes (optionnel)..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="min-w-32">
              Créer la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Order Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de la commande
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">{selectedOrder.number}</span>
                <Badge
                  variant="secondary"
                  className={ORDER_STATUS_MAP[selectedOrder.status]?.className}
                >
                  {ORDER_STATUS_MAP[selectedOrder.status]?.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedOrder.client?.companyName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.client?.contactName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Commercial</p>
                  <p className="font-medium">{selectedOrder.commercial?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">{formatDA(selectedOrder.total)}</p>
                </div>
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Articles</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Produit</TableHead>
                          <TableHead className="text-xs text-center">Qté</TableHead>
                          <TableHead className="text-xs text-right">Prix</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs font-medium">
                              {item.product?.name || 'Produit'}
                            </TableCell>
                            <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                            <TableCell className="text-xs text-right">
                              {formatDA(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">
                              {formatDA(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {selectedOrder.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
