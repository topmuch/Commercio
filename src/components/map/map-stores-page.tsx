'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin,
  Map,
  Filter,
  Store,
  Building2,
  Search,
  Phone,
  ChevronRight,
  X,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'

interface ClientStore {
  id: string
  companyName: string
  contactName: string
  phone: string
  whatsapp?: string
  address?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  sector?: string
  type: string
  status: string
  commercialName?: string
  commercialId?: string
  orderCount: number
  _revenue: number
}

interface RegionData {
  name: string
  clientCount: number
  revenue: number
  stores: ClientStore[]
}

interface ByType {
  type: string
  count: number
}

interface CityData {
  name: string
  count: number
}

interface Commercial {
  id: string
  name: string
}

function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'supermarche': return 'Supermarché'
    case 'grossiste': return 'Grossiste'
    case 'revendeur': return 'Revendeur'
    case 'boutique': return 'Boutique'
    default: return type
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'supermarche': return 'bg-violet-500'
    case 'grossiste': return 'bg-orange-500'
    case 'revendeur': return 'bg-emerald-600'
    case 'boutique': return 'bg-erp-orange'
    default: return 'bg-gray-500'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-500'
    case 'prospect': return 'bg-amber-500'
    case 'inactive': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

function getRegionHeatColor(revenue: number, maxRevenue: number): string {
  if (maxRevenue === 0) return 'bg-gray-100 dark:bg-gray-800'
  const ratio = revenue / maxRevenue
  if (ratio > 0.6) return 'bg-emerald-600'
  if (ratio > 0.3) return 'bg-emerald-400'
  if (ratio > 0.1) return 'bg-emerald-200 dark:bg-emerald-800'
  return 'bg-gray-200 dark:bg-gray-700'
}

function getRegionHeatTextColor(revenue: number, maxRevenue: number): string {
  if (maxRevenue === 0) return 'text-muted-foreground'
  const ratio = revenue / maxRevenue
  if (ratio > 0.3) return 'text-white'
  return 'text-foreground'
}

// ====== REGION CARD ON MAP ======
function RegionMapCard({
  region,
  maxRevenue,
  isSelected,
  onClick,
}: {
  region: RegionData
  maxRevenue: number
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`relative rounded-xl p-3 sm:p-4 transition-all duration-200 border-2 cursor-pointer text-left w-full ${
        getRegionHeatColor(region.revenue, maxRevenue)
      } ${isSelected ? 'ring-2 ring-orange-400 ring-offset-2 scale-105 shadow-lg' : 'hover:scale-102 hover:shadow-md'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${getRegionHeatTextColor(region.revenue, maxRevenue)}`} />
          <h3 className={`text-sm font-bold ${getRegionHeatTextColor(region.revenue, maxRevenue)}`}>
            {region.name}
          </h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${getRegionHeatTextColor(region.revenue, maxRevenue)}`}>
          <MapPin className="h-3 w-3" />
          {region.clientCount}
        </div>
      </div>
      <p className={`text-xs ${getRegionHeatTextColor(region.revenue, maxRevenue)} opacity-80`}>
        {formatDZD(region.revenue)}
      </p>
    </button>
  )
}

// ====== STATS SIDEBAR ======
function StatsSidebar({
  totalClients,
  regions,
  byType,
}: {
  totalClients: number
  regions: RegionData[]
  byType: ByType[]
}) {
  return (
    <div className="space-y-4">
      {/* Total */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30">
              <Store className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Points de Vente</p>
              <p className="text-xl font-bold text-foreground">{totalClients}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Type */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" />
            Par Type
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {byType.map((t) => (
            <div key={t.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getTypeColor(t.type)}`} />
                <span className="text-sm text-foreground">{getTypeLabel(t.type)}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {t.count}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* By Region */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <Map className="h-3.5 w-3.5" />
            Par Région
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {regions.slice(0, 8).map((r) => (
            <div key={r.name} className="flex items-center justify-between">
              <span className="text-sm text-foreground truncate mr-2">{r.name}</span>
              <Badge variant="secondary" className="text-[10px] font-semibold shrink-0">
                {r.clientCount}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ====== MAIN PAGE ======
export default function MapStoresPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCommercial, setFilterCommercial] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const setSelectedClient = useAppStore((s) => s.setSelectedClient)

  const { data, isLoading } = useQuery<{
    data: {
      clients: ClientStore[]
      regions: RegionData[]
      byType: ByType[]
      cities: CityData[]
      commercials: Commercial[]
      totalClients: number
      totalRevenue: number
    }
    count: number
  }>({
    queryKey: ['map-stores'],
    queryFn: () => fetch('/api/map/stores').then((r) => r.json()),
  })

  const clients = data?.data?.clients || []
  const regions = data?.data?.regions || []
  const byType = data?.data?.byType || []
  const commercials = data?.data?.commercials || []
  const totalClients = data?.data?.totalClients || 0

  const maxRegionRevenue = Math.max(...regions.map((r) => r.revenue), 1)

  // Filter clients
  const filteredClients = clients.filter((c) => {
    if (filterRegion !== 'all' && c.region !== filterRegion) return false
    if (filterType !== 'all' && c.type !== filterType) return false
    if (filterCommercial !== 'all' && c.commercialId !== filterCommercial) return false
    if (searchQuery && !c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()))) return false
    if (selectedRegion && c.region !== selectedRegion) return false
    return true
  })

  const handleClientClick = (clientId: string) => {
    setSelectedClient(clientId)
    setCurrentPage('client-detail')
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-erp-orange" />
            Carte des Commerces
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisez vos points de vente sur le territoire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 text-xs">
            {totalClients} points de vente
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filtres
            {showFilters && <X className="h-3 w-3 ml-1.5" />}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Région</label>
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {byType.map((t) => (
                      <SelectItem key={t.type} value={t.type}>{getTypeLabel(t.type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Commercial</label>
                <Select value={filterCommercial} onValueChange={setFilterCommercial}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les commerciaux</SelectItem>
                    {commercials.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom, ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Area */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  Cartographie — {selectedRegion || 'Toutes les régions'}
                </h3>
                {selectedRegion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRegion(null)}
                    className="text-xs h-7"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Voir tout
                  </Button>
                )}
              </div>

              {/* Visual Map Representation */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {regions.map((region) => (
                    <RegionMapCard
                      key={region.name}
                      region={region}
                      maxRevenue={maxRegionRevenue}
                      isSelected={selectedRegion === region.name}
                      onClick={() =>
                        setSelectedRegion(selectedRegion === region.name ? null : region.name)
                      }
                    />
                  ))}
                </div>
              )}

              {/* Heatmap Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground">Légende:</span>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 rounded bg-emerald-600" />
                  <span className="text-[10px] text-muted-foreground">Élevé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 rounded bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">Moyen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 rounded bg-emerald-200 dark:bg-emerald-800" />
                  <span className="text-[10px] text-muted-foreground">Faible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-8 rounded bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] text-muted-foreground">Nul</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Markers List */}
          <Card className="border-0 shadow-sm mt-4">
            <CardHeader className="px-4 sm:px-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Points de vente ({filteredClients.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-150 text-left"
                      onClick={() => handleClientClick(client.id)}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(client.type)}`}>
                        {client.type === 'supermarche' ? (
                          <Building2 className="h-5 w-5 text-white" />
                        ) : (
                          <Store className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{client.companyName}</span>
                          <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(client.status)}`} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{client.contactName}</span>
                          {client.city && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {client.city}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={`text-[9px] h-4 px-1.5 ${getTypeColor(client.type)} text-white`}
                          >
                            {getTypeLabel(client.type)}
                          </Badge>
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {formatDZD(client._revenue)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({client.orderCount} cmd)
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="py-8 text-center">
                      <Store className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Aucun point de vente trouvé</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            ) : (
              <StatsSidebar
                totalClients={totalClients}
                regions={regions}
                byType={byType}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
