"use client"

import React from 'react'
import { useAppStore } from '@/lib/store'
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  Receipt,
  Truck,
  MessageSquare,
  MapPin,
  Map,
  Store,
  BarChart3,
  Bot,
} from 'lucide-react'

const pageLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  clients: 'CRM Clients',
  'client-detail': 'Fiche Client',
  commercials: 'Commerciaux',
  products: 'Produits',
  stock: 'Stock',
  quotes: 'Devis',
  invoices: 'Facturation',
  orders: 'Commandes',
  discussions: 'Discussions',
  'map-stores': 'Carte Commerces',
  'map-sales': 'Carte des Ventes',
  boutique: 'Boutique Publique',
  reports: 'Rapports',
  'ai-assistant': 'Assistant IA',
  settings: 'Paramètres',
}

const commandPages = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'clients', label: 'CRM Clients', icon: Users },
  { id: 'commercials', label: 'Commerciaux', icon: Users },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  { id: 'quotes', label: 'Devis', icon: FileText },
  { id: 'invoices', label: 'Facturation', icon: Receipt },
  { id: 'stock', label: 'Stock', icon: Warehouse },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'map-stores', label: 'Carte Commerces', icon: MapPin },
  { id: 'map-sales', label: 'Carte des Ventes', icon: Map },
  { id: 'boutique', label: 'Boutique Publique', icon: Store },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'ai-assistant', label: 'Assistant IA', icon: Bot },
]

export function AppHeader() {
  const currentPage = useAppStore((s) => s.currentPage)
  const user = useAppStore((s) => s.user)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const [commandOpen, setCommandOpen] = React.useState(false)

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex shrink-0"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">
            {pageLabels[currentPage] || 'Tableau de bord'}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden sm:flex items-center gap-2 text-muted-foreground h-9 w-64 justify-start"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Rechercher...</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCommandOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-erp-orange" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="text-sm font-medium">Nouvelle commande #CMD-2024-0089</span>
                <span className="text-xs text-muted-foreground">Il y a 5 minutes</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="text-sm font-medium">Stock faible : Produit A-102</span>
                <span className="text-xs text-muted-foreground">Il y a 15 minutes</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="text-sm font-medium">Devis DEV-2024-0045 accepté</span>
                <span className="text-xs text-muted-foreground">Il y a 1 heure</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Rechercher une page, un client..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {commandPages.map((page) => {
              const Icon = page.icon
              return (
                <CommandItem
                  key={page.id}
                  onSelect={() => {
                    setCurrentPage(page.id as any)
                    setCommandOpen(false)
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
