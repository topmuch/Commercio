'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Settings,
  User,
  Building2,
  Palette,
  Bell,
  Shield,
  Camera,
  Mail,
  Phone,
  MapPin,
  Upload,
  AlertTriangle,
  Moon,
  Sun,
  Save,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Main component ────────────────────────────────────────────────────

export default function SettingsPage() {
  const user = useAppStore((s) => s.user)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || 'Mamadou Diallo')
  const [profileEmail, setProfileEmail] = useState(user?.email || 'mamadou@distribuerp.com')
  const [profilePhone, setProfilePhone] = useState('+221 77 123 45 67')

  // Company state
  const [companyName, setCompanyName] = useState('DistribuERP SARL')
  const [companyEmail, setCompanyEmail] = useState('contact@distribuerp.com')
  const [companyPhone, setCompanyPhone] = useState('+221 33 123 45 67')
  const [companyAddress, setCompanyAddress] = useState('45 Rue Carnot, Plateau, Dakar, Sénégal')

  // Notification state
  const [notifications, setNotifications] = useState({
    orders: true,
    stock: true,
    clients: false,
    reports: true,
    marketing: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const initials = profileName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Profile Section ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profil utilisateur</CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{profileName}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
              <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs">
                <Upload className="h-3 w-3" />
                Changer la photo
              </Button>
            </div>
          </div>

          <Separator />

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-xs font-medium">
                Nom complet
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-name"
                  className="pl-9"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-xs font-medium">
                Adresse e-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-email"
                  type="email"
                  className="pl-9"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="text-xs font-medium">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-phone"
                  className="pl-9"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Rôle</Label>
              <Input className="bg-muted text-muted-foreground" value={user?.role?.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()) || 'Admin'} disabled />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => toast({ title: 'Succès', description: 'Profil sauvegardé' })}>
              <Save className="h-4 w-4" />
              Sauvegarder le profil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Company Section ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-erp-orange/10">
              <Building2 className="h-4 w-4 text-erp-orange" />
            </div>
            <div>
              <CardTitle className="text-base">Informations de l&apos;entreprise</CardTitle>
              <CardDescription>Détails de votre société</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company logo area */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-erp-orange to-erp-orange/80 text-white font-bold text-lg shadow-sm">
              D
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{companyName}</p>
              <p className="text-xs text-muted-foreground">Plan Pro</p>
              <Button variant="outline" size="sm" className="mt-1.5 gap-1.5 text-xs">
                <Upload className="h-3 w-3" />
                Changer le logo
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-xs font-medium">
                Nom de l&apos;entreprise
              </Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-email" className="text-xs font-medium">
                E-mail de l&apos;entreprise
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company-email"
                  type="email"
                  className="pl-9"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-phone" className="text-xs font-medium">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company-phone"
                  className="pl-9"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-address" className="text-xs font-medium">
                Adresse
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company-address"
                  className="pl-9"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => toast({ title: 'Succès', description: 'Informations sauvegardées' })}>
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance Section ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
              <Palette className="h-4 w-4 text-chart-4" />
            </div>
            <div>
              <CardTitle className="text-base">Apparence</CardTitle>
              <CardDescription>Personnalisez l&apos;affichage</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {theme === 'light' ? (
                  <Sun className="h-5 w-5 text-erp-orange" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Thème</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === 'light' ? 'Mode clair activé' : 'Mode sombre activé'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                theme === 'dark' ? 'bg-primary' : 'bg-muted'
              )}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span
                className={cn(
                  'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Notification Settings ──────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-erp-success/10">
              <Bell className="h-4 w-4 text-erp-success" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Configurez vos alertes et notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: 'orders' as const,
              label: 'Nouvelles commandes',
              description: 'Recevoir une notification pour chaque nouvelle commande',
            },
            {
              key: 'stock' as const,
              label: 'Alertes de stock',
              description: 'Notification quand un produit atteint le seuil minimum',
            },
            {
              key: 'clients' as const,
              label: 'Nouveaux clients',
              description: 'Notification lors de l\'ajout d\'un nouveau client',
            },
            {
              key: 'reports' as const,
              label: 'Rapports hebdomadaires',
              description: 'Recevoir un résumé hebdomadaire des performances',
            },
            {
              key: 'marketing' as const,
              label: 'Offres et mises à jour',
              description: 'Promotions, nouveautés et communications marketing',
            },
          ].map((item, i) => (
            <React.Fragment key={item.key}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={() => toggleNotification(item.key)}
                />
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      {/* ── Danger Zone ──────────────────────────────────── */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
              <CardDescription>Actions irréversibles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-destructive">Supprimer le compte</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cette action est permanente et toutes vos données seront perdues.
                  Les commandes en cours seront annulées.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled
              className="shrink-0"
            >
              Supprimer mon compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
