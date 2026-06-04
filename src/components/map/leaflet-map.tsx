'use client'

import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, MapPin, Phone, Building2, TrendingUp } from 'lucide-react'

// ─── Status colors ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  lead_rouge: '#ef4444',
  negociation_orange: '#f97316',
  client_vert: '#22c55e',
}

const STATUS_LABELS: Record<string, { label: string; colorClass: string }> = {
  lead_rouge: { label: 'Lead', colorClass: 'bg-red-500 text-white' },
  negociation_orange: { label: 'Négociation', colorClass: 'bg-orange-500 text-white' },
  client_vert: { label: 'Client', colorClass: 'bg-green-500 text-white' },
}

// ─── Custom colored icon per client status ────────────────────────────

function createCustomIcon(status: string) {
  const color = STATUS_COLORS[status] || '#6b7280'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:4px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center"><div style="width:14px;height:14px;background:white;border-radius:50%;opacity:.9"></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' CFA'
}

// ─── Fit bounds controller ────────────────────────────────────────────

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 })
    }
  }, [bounds, map])
  return null
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface MapClient {
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

// ─── Component ───────────────────────────────────────────────────────

interface LeafletMapProps {
  clients: MapClient[]
  onClientSelect?: (clientId: string) => void
}

export default function LeafletMap({ clients, onClientSelect }: LeafletMapProps) {
  const bounds = useMemo(() => {
    const validClients = clients.filter((c) => c.latitude && c.longitude)
    if (validClients.length === 0) return null
    const latLngs: L.LatLngExpression[] = validClients.map((c) => [c.latitude!, c.longitude!])
    return L.latLngBounds(latLngs) as unknown as L.LatLngBoundsExpression
  }, [clients])

  const geoClients = clients.filter((c) => c.latitude && c.longitude)

  return (
    <MapContainer
      center={[14.4974, -14.4524]}
      zoom={7}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bounds && <FitBounds bounds={bounds} />}
      {geoClients.map((client) => (
        <Marker
          key={client.id}
          position={[client.latitude!, client.longitude!]}
          icon={createCustomIcon(client.status)}
          eventHandlers={{ click: () => onClientSelect?.(client.id) }}
        >
          <Popup maxWidth={320} minWidth={280}>
            <div className="p-1 min-w-[260px]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-base text-slate-900 leading-tight flex-1 pr-2">{client.companyName}</h3>
                {(() => {
                  const info = STATUS_LABELS[client.status]
                  return info ? <Badge className={`text-[10px] px-1.5 py-0 font-bold ${info.colorClass}`}>{info.label}</Badge> : null
                })()}
              </div>
              <div className="space-y-1.5 text-sm text-slate-700">
                <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span>{client.contactName}</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span>{client.city || 'Non spécifié'}{client.region ? `, ${client.region}` : ''}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span>{client.phone}</span></div>
                {client.commercialName && <div className="text-xs text-slate-500 mt-1 pt-1 border-t border-slate-200">Commercial : {client.commercialName}</div>}
                {client._revenue > 0 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 font-semibold">
                    <span className="text-slate-600 text-xs flex items-center gap-1"><TrendingUp className="h-3 w-3" />CA Généré :</span>
                    <span className="text-blue-600">{formatCFA(client._revenue)}</span>
                  </div>
                )}
                {client.orderCount > 0 && <div className="text-[11px] text-slate-500">{client.orderCount} commande{client.orderCount > 1 ? 's' : ''}</div>}
              </div>
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium" asChild>
                  <a href={`https://wa.me/${(client.whatsapp || client.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${client.companyName},\\n\\nJe suis votre commercial chez DistribuSN.\\n\\nJe souhaiterais faire un point sur vos besoins en produits.`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
                </Button>
                <Button size="sm" className="flex-1 h-8 gap-1.5 text-xs font-medium" variant="outline" asChild>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`} target="_blank" rel="noopener noreferrer"><MapPin className="h-3.5 w-3.5" />Itinéraire</a>
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
