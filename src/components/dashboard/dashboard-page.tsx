'use client'

import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  Loader2,
  Plus,
  FileText,
  Truck,
  BarChart3,
  RotateCcw,
  Smartphone,
  Store,
  QrCode,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/lib/store'

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
  clientStatusDistribution: {
    leadRouge: number
    negociationOrange: number
    clientVert: number
  }
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
  revenueChartData: Array<{ month: string; value: number }>
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
  new: { label: 'Nouvelle', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  validated: { label: 'Validée', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  preparation: { label: 'En préparation', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  shipped: { label: 'Expédiée', className: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  delivered: { label: 'Livrée', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  cancelled: { label: 'Annulée', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Chart Colors ────────────────────────────────────────────────────────

const CHART_COLORS = {
  bar: '#34d399',
  line: '#fbbf24',
  pie: ['#ef4444', '#f97316', '#22c55e'],
  area: '#60a5fa',
  axis: '#94a3b8',
  grid: 'rgba(148, 163, 184, 0.1)',
  tooltipBg: 'rgba(15, 23, 42, 0.9)',
  tooltipBorder: 'rgba(148, 163, 184, 0.2)',
  tooltipText: '#e2e8f0',
  tooltipMuted: '#94a3b8',
}

// ─── Circular Progress Component ───────────────────────────────────────────

function CircularProgress({
  value,
  size = 140,
  strokeWidth = 10,
  label,
  color = '#34d399',
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{Math.round(value)}%</span>
        {label && <span className="text-xs text-white/60 mt-0.5">{label}</span>}
      </div>
    </div>
  )
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl"
      style={{
        background: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      }}
    >
      <p className="text-xs font-medium" style={{ color: CHART_COLORS.tooltipMuted }}>
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-bold" style={{ color: CHART_COLORS.tooltipText }}>
          {entry.name === 'value' ? 'CA' : entry.name} : {formatCFA(entry.value)}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl"
      style={{
        background: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      }}
    >
      <p className="text-sm font-bold text-white">{d.name}</p>
      <p className="text-xs" style={{ color: CHART_COLORS.tooltipMuted }}>
        {d.value} clients ({d.payload.percent !== undefined ? `${Math.round(d.payload.percent)}%` : ''})
      </p>
    </div>
  )
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl"
      style={{
        background: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
      }}
    >
      <p className="text-sm font-bold text-white">{d.name}</p>
      <p className="text-xs" style={{ color: CHART_COLORS.tooltipMuted }}>
        CA : {formatShortCFA(d.revenue)}
      </p>
      <p className="text-xs" style={{ color: CHART_COLORS.tooltipMuted }}>
        Objectif : {Math.round(d.targetAchieved)}%
      </p>
    </div>
  )
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/10 text-white ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-24 rounded bg-white/20" />
                <div className="h-8 w-32 rounded bg-white/20" />
                <div className="h-3 w-28 rounded bg-white/10" />
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20" />
            </div>
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-white/10 backdrop-blur-sm p-6 animate-pulse">
          <div className="h-5 w-48 rounded bg-white/20 mb-4" />
          <div className="h-72 rounded bg-white/10" />
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 animate-pulse">
          <div className="h-5 w-40 rounded bg-white/20 mb-4" />
          <div className="h-72 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 animate-pulse">
            <div className="h-5 w-40 rounded bg-white/20 mb-4" />
            <div className="h-48 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-white/20 mb-4" />
        <div className="h-32 rounded bg-white/10" />
      </div>
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 animate-pulse">
        <div className="h-5 w-48 rounded bg-white/20 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Component ──────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Erreur de chargement')
      return res.json()
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  // ─── Loading State ───
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // ─── Error State ───
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-white/80 text-sm">{error?.message || 'Aucune donnée disponible'}</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  // ─── Derived Data ───

  // Conversion rate: clientVert / total clients
  const totalClients = data.clientCount || 1
  const conversionRate =
    data.clientStatusDistribution?.clientVert !== undefined
      ? (data.clientStatusDistribution.clientVert / totalClients) * 100
      : 0

  // Average target achievement from commercials
  const avgTargetAchievement =
    data.topCommercials.length > 0
      ? data.topCommercials.reduce((sum, c) => sum + c.targetAchieved, 0) / data.topCommercials.length
      : 0

  // Client distribution for pie chart
  const clientDistribution = data.clientStatusDistribution
    ? [
        { name: 'Lead Rouge', value: data.clientStatusDistribution.leadRouge, fill: CHART_COLORS.pie[0] },
        { name: 'Négociation', value: data.clientStatusDistribution.negociationOrange, fill: CHART_COLORS.pie[1] },
        { name: 'Client Vert', value: data.clientStatusDistribution.clientVert, fill: CHART_COLORS.pie[2] },
      ].filter((d) => d.value > 0)
    : []

  // Compute percentages for pie tooltip
  const totalDist = clientDistribution.reduce((s, d) => s + d.value, 0) || 1
  clientDistribution.forEach((d) => {
    (d as any).percent = (d.value / totalDist) * 100
  })

  // Top commercials for horizontal bar chart
  const commercialBarData = data.topCommercials.map((c) => ({
    name: c.name,
    revenue: c.revenue,
    targetAchieved: c.targetAchieved,
  }))

  // Orders trend data from revenue chart
  const ordersTrendData = data.revenueChartData.map((d) => ({
    ...d,
    shortMonth: d.month.split(' ')[0],
  }))

  return (
    <div className="min-h-screen space-y-6">
      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Clients Actifs */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Clients Actifs</p>
              <p className="text-3xl font-bold mt-1">
                {data.clientCount.toLocaleString('fr-FR')}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {data.clientGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {data.clientGrowth >= 0 ? '+' : ''}
                  {data.clientGrowth.toFixed(1)}% vs mois précédent
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Commandes du Mois */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Commandes du Mois</p>
              <p className="text-3xl font-bold mt-1">
                {data.orderCount.toLocaleString('fr-FR')}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {data.orderGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {data.orderGrowth >= 0 ? '+' : ''}
                  {data.orderGrowth.toFixed(1)}% vs mois précédent
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Taux de Conversion */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Taux de Conversion</p>
              <p className="text-3xl font-bold mt-1">{conversionRate.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-white/70">
                  {data.clientStatusDistribution?.clientVert || 0} clients convertis
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Target className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Chiffre d'Affaires */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Chiffre d&apos;Affaires</p>
              <p className="text-3xl font-bold mt-1">{formatShortCFA(data.revenueMonth)}</p>
              <div className="flex items-center gap-1 mt-2">
                {data.revenueMonthGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {data.revenueMonthGrowth >= 0 ? '+' : ''}
                  {data.revenueMonthGrowth.toFixed(1)}% vs mois précédent
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Revenue Combo + Client Donut ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue Evolution - Bar + Line Combo */}
        <ChartCard title="Évolution du Chiffre d'Affaires" className="lg:col-span-2">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.bar} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={CHART_COLORS.bar} stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                  tickFormatter={(v: string) => v.split(' ')[0]}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatShortCFA(v)}
                  dx={-4}
                  width={65}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar
                  dataKey="value"
                  name="value"
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.line}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: CHART_COLORS.line, fill: '#1a1a2e' }}
                />
                <Legend
                  formatter={(value: string) => (value === 'value' ? 'CA mensuel' : value)}
                  wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.axis }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Client Distribution Donut */}
        <ChartCard title="Répartition des Clients">
          <div className="h-80 w-full flex items-center justify-center">
            {clientDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {clientDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ color: CHART_COLORS.axis, fontSize: '11px' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                Aucune donnée
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ─── Charts Row 2: Circular Progress + Top Commercials + Orders Trend ─── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Target Achievement - Circular Progress */}
        <ChartCard title="Objectif Moyen Atteint">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <CircularProgress
              value={avgTargetAchievement}
              size={140}
              strokeWidth={10}
              label="atteint"
              color={
                avgTargetAchievement >= 80
                  ? '#34d399'
                  : avgTargetAchievement >= 50
                    ? '#fbbf24'
                    : '#f87171'
              }
            />
            <div className="text-center">
              <p className="text-white/70 text-xs">
                Basé sur {data.topCommercials.length} commercial{data.topCommercials.length > 1 ? 's' : ''}
              </p>
              <p className="text-white text-sm font-medium mt-1">
                {avgTargetAchievement >= 80
                  ? 'Excellent ! 🎯'
                  : avgTargetAchievement >= 50
                    ? 'En bonne voie 💪'
                    : 'À améliorer ⚡'}
              </p>
            </div>
          </div>
        </ChartCard>

        {/* Top Commercials - Horizontal Bar */}
        <ChartCard title="Performance Commerciaux">
          <div className="h-64 w-full">
            {commercialBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={commercialBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => formatShortCFA(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {commercialBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.targetAchieved >= 80
                            ? '#34d399'
                            : entry.targetAchieved >= 50
                              ? '#fbbf24'
                              : '#f87171'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                Aucune donnée
              </div>
            )}
          </div>
        </ChartCard>

        {/* Orders Trend - Area Chart */}
        <ChartCard title="Tendance des Commandes">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.area} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.area} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatShortCFA(v)}
                  dx={-4}
                  width={60}
                />
                <Tooltip content={<DarkTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.area}
                  strokeWidth={2}
                  fill="url(#orderTrendGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_COLORS.area, fill: '#1a1a2e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ─── Quick Actions Bar ─── */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white/80 shrink-0">Accès rapide :</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('orders')}
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle Commande
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('quotes')}
            >
              <FileText className="h-3.5 w-3.5" />
              Nouveau Devis
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('clients')}
            >
              <Users className="h-3.5 w-3.5" />
              Ajouter Client
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('products')}
            >
              <Package className="h-3.5 w-3.5" />
              Produits
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('stock')}
            >
              <Truck className="h-3.5 w-3.5" />
              Stock
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('reports')}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Rapports
            </Button>
            <a href="/install-app" target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Installer App
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              onClick={() => useAppStore.getState().setCurrentPage('boutique')}
            >
              <Store className="h-3.5 w-3.5" />
              Ma Boutique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Recent Orders Table ─── */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">Commandes Récentes</CardTitle>
            <Badge variant="outline" className="border-white/20 text-white/70">
              <ShoppingCart className="mr-1 h-3 w-3" />
              {data.orderCount} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {data.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50 text-xs w-[130px]">N°</TableHead>
                    <TableHead className="text-white/50 text-xs">Client</TableHead>
                    <TableHead className="text-white/50 text-xs hidden md:table-cell">Commercial</TableHead>
                    <TableHead className="text-white/50 text-xs text-right">Montant</TableHead>
                    <TableHead className="text-white/50 text-xs text-center">Statut</TableHead>
                    <TableHead className="text-white/50 text-xs text-right hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => {
                    const statusInfo = statusMap[order.status] || {
                      label: order.status,
                      className: 'bg-white/10 text-white/70 border-white/10',
                    }
                    return (
                      <TableRow
                        key={order.id}
                        className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <TableCell className="font-medium text-white text-xs">{order.number}</TableCell>
                        <TableCell className="text-white/80 text-xs font-medium">{order.client}</TableCell>
                        <TableCell className="text-white/50 text-xs hidden md:table-cell">
                          {order.commercial || '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-white text-xs">
                          {formatCFA(order.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusInfo.className}`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-white/50 text-xs hidden sm:table-cell">
                          {formatDate(order.date)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-white/40">
              Aucune commande pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
