'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingDown,
  Clock,
  CalendarDays,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
import type { Invoice, Client, Product, Payment } from '@/lib/types'

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

const INVOICE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  paid: { label: 'Payée', className: 'bg-green-100 text-green-700' },
  partially_paid: { label: 'Partiellement payée', className: 'bg-yellow-100 text-yellow-700' },
  unpaid: { label: 'Impayée', className: 'bg-gray-100 text-gray-700' },
  overdue: { label: 'En retard', className: 'bg-red-100 text-red-700' },
}

const STATUS_TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'paid', label: 'Payée' },
  { value: 'partially_paid', label: 'Partiellement payée' },
  { value: 'unpaid', label: 'Impayée' },
  { value: 'overdue', label: 'En retard' },
]

interface KPI {
  totalBilled: number
  totalPaid: number
  totalUnpaid: number
  overdueCount: number
}

interface InvoiceItemRow {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

// ── Component ────────────────────────────────────────────
export default function InvoicesPage() {
  // toast imported from sonner

  // Data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<KPI>({ totalBilled: 0, totalPaid: 0, totalUnpaid: 0, overdueCount: 0 })

  // Filters
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Create form
  const [formClientId, setFormClientId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formDiscount, setFormDiscount] = useState(0)
  const [formDueDate, setFormDueDate] = useState('')
  const [formItems, setFormItems] = useState<InvoiceItemRow[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0 },
  ])
  const [clientSearch, setClientSearch] = useState('')

  // Payment form
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payReference, setPayReference] = useState('')
  const [payNotes, setPayNotes] = useState('')

  // ── Fetch invoices ──
  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/invoices?${params}`)
      const json = await res.json()
      if (json.data) {
        setInvoices(json.data)
        setTotalPages(json.totalPages || 1)
      }
      if (json.kpi) {
        setKpi(json.kpi)
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les factures', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, page, toast])

  // ── Fetch status counts ──
  const fetchCounts = useCallback(async () => {
    try {
      const statuses = ['paid', 'partially_paid', 'unpaid', 'overdue']
      const countsMap: Record<string, number> = {}
      await Promise.all(
        statuses.map(async (s) => {
          const res = await fetch(`/api/invoices?status=${s}&limit=1`)
          const json = await res.json()
          countsMap[s] = json.count || 0
        })
      )
      const resAll = await fetch('/api/invoices?limit=1')
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
    fetchInvoices()
    fetchCounts()
    fetchClients()
    fetchProducts()
  }, [fetchInvoices, fetchCounts, fetchClients, fetchProducts])

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

  const updateItem = (idx: number, field: keyof InvoiceItemRow, value: string | number) => {
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

  // ── Submit invoice ──
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
      const res = await fetch('/api/invoices', {
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
          dueDate: formDueDate || undefined,
          notes: formNotes || undefined,
        }),
      })
      const json = await res.json()
      if (json.error) {
        toast({ title: 'Erreur', description: json.error, variant: 'destructive' })
      } else {
        toast({ title: 'Succès', description: 'Facture créée avec succès' })
        setDialogOpen(false)
        resetForm()
        fetchInvoices()
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
    setFormDueDate('')
    setFormItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0 }])
    setClientSearch('')
  }

  // ── Submit payment ──
  const handlePayment = async () => {
    if (!selectedInvoice || !payAmount || parseFloat(payAmount) <= 0) {
      toast({ title: 'Erreur', description: 'Montant invalide', variant: 'destructive' })
      return
    }

    const remaining = selectedInvoice.total - selectedInvoice.paid
    if (parseFloat(payAmount) > remaining) {
      toast({
        title: 'Erreur',
        description: `Le montant dépasse le restant dû (${formatDA(remaining)})`,
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: parseFloat(payAmount),
          method: payMethod,
          reference: payReference || undefined,
          notes: payNotes || undefined,
        }),
      })
      const json = await res.json()
      if (json.error) {
        toast({ title: 'Erreur', description: json.error, variant: 'destructive' })
      } else {
        toast({ title: 'Succès', description: 'Paiement enregistré avec succès' })
        setPaymentOpen(false)
        resetPaymentForm()
        fetchInvoices()
        fetchCounts()
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur lors de l\'enregistrement', variant: 'destructive' })
    }
  }

  const resetPaymentForm = () => {
    setPayAmount('')
    setPayMethod('cash')
    setPayReference('')
    setPayNotes('')
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentOpen(true)
    resetPaymentForm()
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
            <Receipt className="h-6 w-6 text-primary" />
            Facturation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos factures et suivez les paiements
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle facture
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total facturé</p>
                <p className="text-lg font-bold">{formatDA(kpi.totalBilled)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total payé</p>
                <p className="text-lg font-bold text-green-600">{formatDA(kpi.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-2">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total impayé</p>
                <p className="text-lg font-bold text-orange-600">{formatDA(kpi.totalUnpaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">En retard</p>
                <p className="text-lg font-bold text-red-600">{kpi.overdueCount} facture(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
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

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Commercial</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="hidden sm:table-cell">Échéance</TableHead>
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
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Aucune facture trouvée</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const statusInfo = INVOICE_STATUS_MAP[invoice.status] || {
                      label: invoice.status,
                      className: 'bg-gray-100 text-gray-700',
                    }
                    const paidPercent = invoice.total > 0
                      ? Math.min(100, Math.round((invoice.paid / invoice.total) * 100))
                      : 0
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs font-medium">
                          {invoice.number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{invoice.client?.companyName}</p>
                            <p className="text-xs text-muted-foreground">{invoice.client?.contactName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {invoice.commercial?.name || '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatDA(invoice.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="min-w-28">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{paidPercent}%</span>
                              <span className="font-medium">{formatDA(invoice.paid)}</span>
                            </div>
                            <Progress
                              value={paidPercent}
                              className="h-1.5"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {invoice.dueDate ? (
                            <span
                              className={`flex items-center gap-1 ${
                                invoice.status === 'overdue' ? 'text-red-600 font-medium' : ''
                              }`}
                            >
                              {invoice.status === 'overdue' && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(invoice.dueDate)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(invoice.status === 'unpaid' ||
                              invoice.status === 'partially_paid' ||
                              invoice.status === 'overdue') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                onClick={() => openPaymentDialog(invoice)}
                                title="Enregistrer un paiement"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedInvoice(invoice)
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

      {/* ── New Invoice Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouvelle facture
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

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Date d'échéance
              </Label>
              <Input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
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
                  <span>Total TTC</span>
                  <span className="text-primary">{formatDA(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes ou conditions de paiement (optionnel)..."
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
              Créer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Payment Dialog ── */}
      <Dialog open={paymentOpen} onOpenChange={(open) => { setPaymentOpen(open); if (!open) resetPaymentForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Enregistrer un paiement
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5">
              {/* Invoice Summary */}
              <Card className="bg-muted/40">
                <CardContent className="p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Facture</span>
                    <span className="font-mono font-medium">{selectedInvoice.number}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">{selectedInvoice.client?.companyName}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">{formatDA(selectedInvoice.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reste à payer</span>
                    <span className="font-bold text-orange-600">
                      {formatDA(selectedInvoice.total - selectedInvoice.paid)}
                    </span>
                  </div>
                  <Progress
                    value={
                      selectedInvoice.total > 0
                        ? Math.round((selectedInvoice.paid / selectedInvoice.total) * 100)
                        : 0
                    }
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label>Montant du paiement *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    max={selectedInvoice.total - selectedInvoice.paid}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    CFA
                  </span>
                </div>
                {payAmount && parseFloat(payAmount) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Reste après paiement:{' '}
                    <span className="font-medium">
                      {formatDA(
                        Math.max(0, selectedInvoice.total - selectedInvoice.paid - parseFloat(payAmount))
                      )}
                    </span>
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                    <SelectItem value="mobile_payment">Paiement mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label>Référence</Label>
                <Input
                  placeholder="N° de chèque, virement..."
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Notes sur le paiement (optionnel)..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPaymentOpen(false); resetPaymentForm() }}>
              Annuler
            </Button>
            <Button onClick={handlePayment} className="min-w-32 bg-green-600 hover:bg-green-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Invoice Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de la facture
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">{selectedInvoice.number}</span>
                <Badge
                  variant="secondary"
                  className={INVOICE_STATUS_MAP[selectedInvoice.status]?.className}
                >
                  {INVOICE_STATUS_MAP[selectedInvoice.status]?.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedInvoice.client?.companyName}</p>
                  <p className="text-xs text-muted-foreground">{selectedInvoice.client?.contactName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Commercial</p>
                  <p className="font-medium">{selectedInvoice.commercial?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Échéance</p>
                  <p className="font-medium">
                    {selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : '—'}
                  </p>
                </div>
              </div>

              {/* Payment progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Paiement</span>
                  <span className="font-medium">
                    {formatDA(selectedInvoice.paid)} / {formatDA(selectedInvoice.total)}
                  </span>
                </div>
                <Progress
                  value={
                    selectedInvoice.total > 0
                      ? Math.round((selectedInvoice.paid / selectedInvoice.total) * 100)
                      : 0
                  }
                  className="h-2"
                />
              </div>

              {/* Payments history */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Historique des paiements</p>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          <span className="font-medium">{formatDA(payment.amount)}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {payment.method === 'cash'
                              ? 'Espèces'
                              : payment.method === 'bank_transfer'
                                ? 'Virement'
                                : payment.method === 'check'
                                  ? 'Chèque'
                                  : 'Mobile'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {payment.createdAt ? formatDate(payment.createdAt) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedInvoice.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
