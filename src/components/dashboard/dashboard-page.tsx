'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Trophy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ─── Types ────────────────────────────────────────────────────────────────

interface DashboardData {
  revenueToday: number
  revenueMonth: number
  orderCount: number
  quoteCount: number
  clientCount: number
  revenueTodayGrowth: number
  revenueMonthGrowth: number
  orderGrowth: number
  clientGrowth: number
  topProducts: {
    id: string
    name: string
    reference: string
    totalSold: number
    revenue: number
    image?: string
  }[]
  topCommercials: {
    id: string
    name: string
    avatar?: string
    revenue: number
    clientCount: number
    orderCount: number
    targetAchieved: number
  }[]
  revenueChartData: { name: string; value: number }[]
  recentOrders: {
    id: string
    number: string
    client: string
    total: number
    status: string
    date: string
    commercial?: string
  }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCFA(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' CFA'
}

function formatShortCFA(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}M CFA`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K CFA`
  return `${value} CFA`
}

const statusMap: Record<string, { label: string; className: string }> = {
  new: { label: 'Nouvelle', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  validated: { label: 'Validée', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  preparation: { label: 'En préparation', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  shipped: { label: 'Expédiée', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
  delivered: { label: 'Livrée', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatCFA(payload[0].value)}</p>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  growth,
  icon: Icon,
  iconBg,
  formatValue = formatCFA,
}: {
  title: string
  value: number
  growth: number
  icon: React.ElementType
  iconBg: string
  formatValue?: (v: number) => string
}) {
  const isPositive = growth >= 0
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight lg:text-3xl">{formatValue(value)}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-erp-success" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-erp-danger" />
          )}
          <span
            className={`text-xs font-semibold ${
              isPositive ? 'text-erp-success' : 'text-erp-danger'
            }`}
          >
            {isPositive ? '+' : ''}
            {growth.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs période précédente</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Dashboard Component ──────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Erreur de chargement')
      const json = await res.json()
      setData(json)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  // ─── Error State ───
  if (error || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-erp-danger">{error || 'Aucune donnée disponible'}</p>
          <button
            onClick={fetchDashboard}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const barColors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a']

  return (
    <div className="space-y-6">
      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Chiffre d'affaires du jour"
          value={data.revenueToday}
          growth={data.revenueTodayGrowth}
          icon={DollarSign}
          iconBg="bg-erp-orange/10 text-erp-orange"
        />
        <KPICard
          title="Chiffre d'affaires du mois"
          value={data.revenueMonth}
          growth={data.revenueMonthGrowth}
          icon={TrendingUp}
          iconBg="bg-chart-1/10 text-chart-1"
        />
        <KPICard
          title="Nombre de commandes"
          value={data.orderCount}
          growth={data.orderGrowth}
          icon={ShoppingCart}
          iconBg="bg-purple-500/10 text-purple-500"
          formatValue={(v) => v.toLocaleString('fr-FR')}
        />
        <KPICard
          title="Nombre de clients"
          value={data.clientCount}
          growth={data.clientGrowth}
          icon={Users}
          iconBg="bg-erp-success/10 text-erp-success"
          formatValue={(v) => v.toLocaleString('fr-FR')}
        />
      </div>

      {/* ─── Revenue Chart ─── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Évolution du Chiffre d&apos;Affaires
              </CardTitle>
              <CardDescription>Revenus mensuels sur les 12 derniers mois</CardDescription>
            </div>
            <Badge variant="secondary" className="font-medium">
              <TrendingUp className="mr-1 h-3 w-3 text-erp-success" />
              12 mois
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatShortCFA(v)}
                  dx={-4}
                  width={72}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-chart-1)', stroke: 'var(--color-card)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Two Column: Top Products + Top Commercials ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 5 Products */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Top 5 Produits</CardTitle>
                <CardDescription>Les produits les plus vendus</CardDescription>
              </div>
              <Badge variant="secondary">
                <Package className="mr-1 h-3 w-3" />
                Ventes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {data.topProducts.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topProducts.map((p) => ({
                      name: p.name.length > 15 ? p.name.slice(0, 14) + '…' : p.name,
                      fullName: p.name,
                      quantity: p.totalSold,
                      revenue: p.revenue,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'var(--color-foreground)', width: 110 }}
                      axisLine={false}
                      tickLine={false}
                      width={110}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
                            <p className="text-xs font-semibold">{d.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              Quantité : <span className="font-medium text-foreground">{d.quantity}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Revenu : <span className="font-medium text-foreground">{formatCFA(d.revenue)}</span>
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="quantity" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {data.topProducts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Commerciaux */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Top Commerciaux</CardTitle>
                <CardDescription>Classement par chiffre d&apos;affaires</CardDescription>
              </div>
              <Badge variant="secondary">
                <Trophy className="mr-1 h-3 w-3" />
                Performance
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {data.topCommercials.length > 0 ? (
              <div className="space-y-4">
                {data.topCommercials.map((comm, idx) => (
                  <div
                    key={comm.id}
                    className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    {/* Rank */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-sm font-bold text-primary">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-9 w-9 shrink-0 border border-border">
                        <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                          {comm.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{comm.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {comm.orderCount} commandes · {comm.clientCount} clients
                        </p>
                      </div>
                    </div>

                    {/* Revenue + Target */}
                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-bold">{formatShortCFA(comm.revenue)}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${comm.targetAchieved}%`,
                              backgroundColor:
                                comm.targetAchieved >= 80
                                  ? 'var(--color-erp-success)'
                                  : comm.targetAchieved >= 50
                                    ? 'var(--color-erp-warning)'
                                    : 'var(--color-erp-danger)',
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground w-8 text-right">
                          {Math.round(comm.targetAchieved)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Orders Table ─── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Commandes Récentes</CardTitle>
              <CardDescription>Les 5 dernières commandes enregistrées</CardDescription>
            </div>
            <Badge variant="secondary">
              <ShoppingCart className="mr-1 h-3 w-3" />
              {data.orderCount} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Commercial</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentOrders.map((order) => {
                const statusInfo = statusMap[order.status] || {
                  label: order.status,
                  className: 'bg-muted text-muted-foreground',
                }
                return (
                  <TableRow key={order.id} className="cursor-pointer transition-colors">
                    <TableCell className="font-medium text-primary">{order.number}</TableCell>
                    <TableCell className="font-medium">{order.client}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {order.commercial || '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCFA(order.total)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                      {formatDate(order.date)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {data.recentOrders.length === 0 && (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Aucune commande pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
