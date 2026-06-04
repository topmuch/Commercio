'use client'

import React, { useEffect } from 'react'
import { useAppStore, type PageId } from '@/lib/store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

// Dynamic imports for code splitting
const DashboardPage = dynamic(
  () => import('@/components/dashboard/dashboard-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const ClientsPage = dynamic(
  () => import('@/components/clients/clients-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const ClientDetail = dynamic(
  () => import('@/components/clients/client-detail').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const CommercialsPage = dynamic(
  () => import('@/components/commercials/commercials-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const ProductsPage = dynamic(
  () => import('@/components/products/products-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const StockPage = dynamic(
  () => import('@/components/stock/stock-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const OrdersPage = dynamic(
  () => import('@/components/orders/orders-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const QuotesPage = dynamic(
  () => import('@/components/quotes/quotes-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const InvoicesPage = dynamic(
  () => import('@/components/invoices/invoices-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const DiscussionsPage = dynamic(
  () => import('@/components/discussions/discussions-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const MapStoresPage = dynamic(
  () => import('@/components/map/map-stores-page').then((m) => m.default),
  { loading: () => <PageLoader />, ssr: false }
)
const MapSalesPage = dynamic(
  () => import('@/components/map/map-sales-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const BoutiquePage = dynamic(
  () => import('@/components/boutique/boutique-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const ReportsPage = dynamic(
  () => import('@/components/reports/reports-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const AIAssistantPage = dynamic(
  () => import('@/components/ai/ai-assistant-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)
const SettingsPage = dynamic(
  () => import('@/components/settings/settings-page').then((m) => m.default),
  { loading: () => <PageLoader /> }
)

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function PageRouter() {
  const currentPage = useAppStore((s) => s.currentPage)
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />
    case 'clients':
      return <ClientsPage />
    case 'client-detail':
      return <ClientDetail />
    case 'commercials':
      return <CommercialsPage />
    case 'products':
      return <ProductsPage />
    case 'stock':
      return <StockPage />
    case 'orders':
      return <OrdersPage />
    case 'quotes':
      return <QuotesPage />
    case 'invoices':
      return <InvoicesPage />
    case 'discussions':
      return <DiscussionsPage />
    case 'map-stores':
      return <MapStoresPage />
    case 'map-sales':
      return <MapSalesPage />
    case 'boutique':
      return <BoutiquePage />
    case 'reports':
      return <ReportsPage />
    case 'ai-assistant':
      return <AIAssistantPage />
    case 'settings':
      return <SettingsPage />
    default:
      return null
  }
}

export default function Home() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <main
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64 ml-0' : 'lg:ml-16 ml-0'
          }`}
        >
          <AppHeader />
          <div className="flex-1 p-4 lg:p-6">
            <PageRouter />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}
