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

const darkPages: string[] = ['dashboard']

export function AppHeader() {
  const currentPage = useAppStore((s) => s.currentPage)
  const user = useAppStore((s) => s.user)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const [commandOpen, setCommandOpen] = React.useState(false)

  const isDark = darkPages.includes(currentPage)

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
      <header
        className={`sticky top-0 z-30 flex h-16 items-center gap-4 backdrop-blur-md px-4 lg:px-6 transition-colors duration-300 ${
          isDark
            ? 'bg-teal-900/40 border-b border-teal-700/30 text-white'
            : 'bg-white/80 border-b border-slate-200 text-slate-900'
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 lg:hidden ${isDark ? 'hover:bg-white/10 text-white/80' : ''}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`hidden lg:flex shrink-0 ${isDark ? 'hover:bg-white/10 text-white/80' : ''}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
            {pageLabels[currentPage] || 'Tableau de bord'}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            className={`hidden sm:flex items-center gap-2 h-9 w-64 justify-start ${
              isDark
                ? 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 placeholder:text-white/30'
                : 'text-muted-foreground'
            }`}
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Rechercher...</span>
            <kbd className={`pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium ${
              isDark ? 'border-white/10 bg-white/5 text-white/40' : 'border bg-muted text-muted-foreground'
            }`}>
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`sm:hidden ${isDark ? 'text-white/80 hover:bg-white/10' : ''}`}
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={isDark ? 'text-white/80 hover:bg-white/10' : ''}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative ${isDark ? 'text-white/80 hover:bg-white/10' : ''}`}
              >
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Aucune nouvelle notification</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center gap-2 px-2 ${isDark ? '' : ''}`}>
                <Avatar className={`h-8 w-8 border-2 ${isDark ? 'border-emerald-400/30' : 'border-primary/20'}`}>
                  <AvatarFallback className={`text-xs font-semibold ${isDark ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className={`hidden md:block text-sm font-medium ${isDark ? 'text-white' : ''}`}>
                  {user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('settings')}>Paramètres</DropdownMenuItem>
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuSeparator />
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
