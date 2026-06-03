'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  Download,
  FileText,
  PieChart as PieChartIcon,
  TrendingUp,
  Filter,
  Users,
  MapPin,
  Package,
  Target,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' CFA'
}

const COLORS = [
  'oklch(0.45 0.12 255)',  // primary blue
  'oklch(0.65 0.2 55)',    // orange
  'oklch(0.6 0.15 150)',   // success green
  'oklch(0.65 0.15 310)',  // pink
  'oklch(0.75 0.15 70)',   // warning yellow
  'oklch(0.5 0.12 45)',    // brown
  'oklch(0.7 0.15 55)',    // light orange
  'oklch(0.55 0.1 150)',   // teal
]

const PIE_COLORS = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#d946ef',
  '#eab308',
  '#6366f1',
  '#14b8a6',
  '#f43f5e',
]

// ── Report Types ──────────────────────────────────────────────────────

type ReportType =
  | 'commercial'
  | 'region'
  | 'product'
  | 'client'
  | 'top-products'
  | 'performance'

interface ReportTypeConfig {
  id: ReportType
  label: string
  description: string
  icon: React.ElementType
  chartType: 'bar' | 'pie' | 'line'
}

const reportTypes: ReportTypeConfig[] = [
  { id: 'commercial', label: 'Ventes par commercial', description: 'Analyse des ventes par chaque commercial', icon: Users, chartType: 'bar' },
  { id: 'region', label: 'Ventes par région', description: 'Répartition géographique des ventes', icon: MapPin, chartType: 'pie' },
  { id: 'product', label: 'Ventes par produit', description: 'Performance individuelle des produits', icon: Package, chartType: 'bar' },
  { id: 'client', label: 'Ventes par client', description: 'Contribution de chaque client', icon: Target, chartType: 'bar' },
  { id: 'top-products', label: 'Produits les plus vendus', description: 'Classement des meilleurs produits', icon: Trophy, chartType: 'bar' },
  { id: 'performance', label: 'Performance commerciaux', description: 'Tendance de performance mensuelle', icon: TrendingUp, chartType: 'line' },
]

// ── Mock Data ──────────────────────────────────────────────────────────

const commercialData = [
  { name: 'Mamadou D.', ventes: 9850000, objectif: 12000000 },
  { name: 'Abdoulaye S.', ventes: 12480000, objectif: 12000000 },
  { name: 'Fatou N.', ventes: 7560000, objectif: 10000000 },
  { name: 'Ibrahima F.', ventes: 11120000, objectif: 10000000 },
  { name: 'Aminata D.', ventes: 6240000, objectif: 8000000 },
  { name: 'Ousmane B.', ventes: 8840000, objectif: 10000000 },
]

const regionData = [
  { name: 'Dakar', value: 38 },
  { name: 'Thiès', value: 18 },
  { name: 'Saint-Louis', value: 12 },
  { name: 'Kaolack', value: 10 },
  { name: 'Ziguinchor', value: 9 },
  { name: 'Tambacounda', value: 7 },
  { name: 'Autres', value: 6 },
]

const productData = [
  { name: 'Coca-Cola 33cl', ventes: 7400000 },
  { name: 'Yaourt Danone', ventes: 6480000 },
  { name: 'Semoule 5kg', ventes: 5920000 },
  { name: 'Harissa CPL', ventes: 4960000 },
  { name: 'Détergent Tide', ventes: 3920000 },
  { name: 'Eau Minérale', ventes: 3560000 },
]

const clientData = [
  { name: 'Supermarché Central', ventes: 12800000 },
  { name: 'Boutique du Port', ventes: 7400000 },
  { name: 'Épicerie Médina', ventes: 5680000 },
  { name: 'Grossiste Sandaga', ventes: 8400000 },
  { name: 'Mini-Market Liberté', ventes: 3920000 },
]

const topProductsData = [
  { name: 'Coca-Cola 33cl', quantité: 45000, CA: 9000000 },
  { name: 'Yaourt Danone 12p', quantité: 28000, CA: 7280000 },
  { name: 'Semoule 5kg', quantité: 32000, CA: 5760000 },
  { name: 'Eau Minérale 1.5L', quantité: 38000, CA: 4560000 },
  { name: 'Harissa CPL 70g', quantité: 18000, CA: 5040000 },
]

const performanceData = [
  { mois: 'Jan', abdoulaye: 280, mamadou: 220, fatou: 180 },
  { mois: 'Fév', abdoulaye: 310, mamadou: 245, fatou: 195 },
  { mois: 'Mar', abdoulaye: 290, mamadou: 260, fatou: 210 },
  { mois: 'Avr', abdoulaye: 340, mamadou: 255, fatou: 175 },
  { mois: 'Mai', abdoulaye: 320, mamadou: 270, fatou: 200 },
  { mois: 'Jun', abdoulaye: 380, mamadou: 290, fatou: 220 },
  { mois: 'Jul', abdoulaye: 350, mamadou: 310, fatou: 240 },
  { mois: 'Aoû', abdoulaye: 400, mamadou: 285, fatou: 215 },
  { mois: 'Sep', abdoulaye: 370, mamadou: 320, fatou: 250 },
  { mois: 'Oct', abdoulaye: 410, mamadou: 330, fatou: 230 },
  { mois: 'Nov', abdoulaye: 390, mamadou: 345, fatou: 260 },
  { mois: 'Déc', abdoulaye: 450, mamadou: 360, fatou: 280 },
]

// ── Summary cards generator ───────────────────────────────────────────

function getSummaryCards(reportType: ReportType) {
  switch (reportType) {
    case 'commercial':
      return [
        { label: 'Total Ventes', value: '56.09M CFA', change: '+12.5%', up: true },
        { label: 'Objectif Global', value: '62M CFA', change: '90.4%', up: true },
        { label: 'Meilleur Commercial', value: 'Abdoulaye S.', change: '12.48M CFA', up: true },
        { label: 'Commerciaux Actifs', value: '6', change: '6/6', up: true },
      ]
    case 'region':
      return [
        { label: 'Région Dominante', value: 'Dakar', change: '38%', up: true },
        { label: 'Couverture', value: '7 régions', change: '+2', up: true },
        { label: 'Croissance Thiès', value: '+18%', change: 'vs mois dernier', up: true },
        { label: 'Nouvelle Zone', value: 'Kaffrine', change: 'Prospect', up: false },
      ]
    case 'product':
      return [
        { label: 'CA Produits', value: '32.24M CFA', change: '+8.3%', up: true },
        { label: 'Produit #1', value: 'Coca-Cola', change: '7.4M CFA', up: true },
        { label: 'Catégorie Top', value: 'Boissons', change: '42% du CA', up: true },
        { label: 'Produits Actifs', value: '248', change: '+12', up: true },
      ]
    case 'client':
      return [
        { label: 'Total Clients', value: '156', change: '+18', up: true },
        { label: 'Meilleur Client', value: 'Superm. Central', change: '12.8M CFA', up: true },
        { label: 'CA Moyen/Client', value: '380K CFA', change: '+5.2%', up: true },
        { label: 'Nouveaux Clients', value: '18', change: 'ce mois', up: true },
      ]
    case 'top-products':
      return [
        { label: 'Ventes Totales', value: '31.64M CFA', change: '+15.2%', up: true },
        { label: 'Unités Vendues', value: '161,000', change: '+12%', up: true },
        { label: 'Meilleur Produit', value: 'Coca-Cola', change: '45,000 unités', up: true },
        { label: 'Marge Moyenne', value: '28%', change: '+2.1%', up: true },
      ]
    case 'performance':
      return [
        { label: 'Score Moyen', value: '305 pts', change: '+15%', up: true },
        { label: 'Top Performeur', value: 'Abdoulaye S.', change: '410 pts/mois', up: true },
        { label: 'Progression Team', value: '+18%', change: 'vs Q3', up: true },
        { label: 'Objectif Atteint', value: '83%', change: '4/6', up: true },
      ]
  }
}

// ── Custom Tooltip ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-muted-foreground" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' && entry.value > 10000
            ? formatCFA(entry.value)
            : entry.value.toLocaleString('fr-FR')}
        </p>
      ))}
    </div>
  )
}

// ── Chart Renderers ────────────────────────────────────────────────────

function CommercialChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={commercialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="ventes" name="Ventes" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="objectif" name="Objectif" fill={COLORS[1]} radius={[4, 4, 0, 0]} opacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function RegionChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={regionData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={140}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${name} (${value}%)`}
          labelLine={true}
        >
          {regionData.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Part']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ProductChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={productData} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ventes" name="Ventes" fill={COLORS[2]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ClientChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={clientData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ventes" name="Ventes" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function TopProductsChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={topProductsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="quantité" name="Quantité" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="CA" name="Chiffre d'affaires" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="abdoulaye" name="Abdoulaye S." stroke={COLORS[1]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="mamadou" name="Mamadou D." stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="fatou" name="Fatou N." stroke={COLORS[3]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const chartRenderers: Record<ReportType, React.FC> = {
  commercial: CommercialChart,
  region: RegionChart,
  product: ProductChart,
  client: ClientChart,
  'top-products': TopProductsChart,
  performance: PerformanceChart,
}

// ── Main component ────────────────────────────────────────────────────

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('commercial')
  const [period, setPeriod] = useState('month')

  const summaryCards = useMemo(() => getSummaryCards(selectedReport), [selectedReport])

  const ChartComponent = chartRenderers[selectedReport]

  return (
    <div className="space-y-6">
      {/* ── Report Type Selector ────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Types de rapports</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id
            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all duration-150 hover:shadow-md ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border/60 hover:border-primary/30'
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{report.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{card.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                card.up ? 'text-erp-success' : 'text-muted-foreground'
              }`}>
                {card.up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{card.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Chart Area ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {reportTypes.find((r) => r.id === selectedReport)?.label}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Données réelles
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-3 h-6">Semaine</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3 h-6">Mois</TabsTrigger>
                <TabsTrigger value="year" className="text-xs px-3 h-6">Année</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ChartComponent />
        </CardContent>
      </Card>

      {/* ── Export Buttons ───────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Exporter le rapport &ldquo;{reportTypes.find((r) => r.id === selectedReport)?.label}&rdquo;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Exporter PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
