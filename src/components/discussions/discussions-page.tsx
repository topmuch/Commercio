'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  Phone,
  FileText,
  MessageCircle,
  Send,
  Search,
  User,
  Store,
  Building2,
  MapPin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface ClientDiscussion {
  id: string
  companyName: string
  contactName: string
  phone: string
  whatsapp?: string
  type: string
  status: string
  city?: string
  region?: string
  commercialName?: string
  discussionCount: number
  lastMessage: string | null
  lastMessageAt: string | null
  lastMessageType: string | null
}

interface DiscussionMessage {
  id: string
  type: string
  content: string
  direction: string
  clientId: string
  commercialId?: string
  companyId: string
  createdAt: string
  client?: {
    id: string
    companyName: string
    contactName: string
    type: string
  }
  commercial?: {
    name: string
  }
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'call':
      return <Phone className="h-3 w-3 text-blue-500" />
    case 'note':
      return <FileText className="h-3 w-3 text-amber-500" />
    case 'whatsapp':
      return <MessageCircle className="h-3 w-3 text-emerald-500" />
    default:
      return <MessageSquare className="h-3 w-3 text-muted-foreground" />
  }
}

function getTypeBgColor(type: string, direction: string): string {
  if (type === 'call') return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
  if (type === 'note') return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
  if (type === 'whatsapp') return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
  // message
  return direction === 'outgoing'
    ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    : 'bg-muted/60 border-border'
}

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'call':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
    case 'note':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    case 'whatsapp':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getClientTypeIcon(type: string) {
  switch (type) {
    case 'supermarche':
      return <Store className="h-3.5 w-3.5 text-violet-500" />
    case 'grossiste':
      return <Building2 className="h-3.5 w-3.5 text-orange-500" />
    case 'revendeur':
      return <Store className="h-3.5 w-3.5 text-emerald-500" />
    default:
      return <Store className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function getClientTypeBg(type: string): string {
  switch (type) {
    case 'supermarche':
      return 'bg-violet-500'
    case 'grossiste':
      return 'bg-orange-500'
    case 'revendeur':
      return 'bg-emerald-600'
    default:
      return 'bg-erp-orange'
  }
}

// ====== CLIENT LIST ITEM ======
function ClientListItem({
  client,
  isSelected,
  onClick,
}: {
  client: ClientDiscussion
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-150 text-left ${
        isSelected
          ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800'
          : 'hover:bg-muted/50 border border-transparent'
      }`}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10 shrink-0 border-2 border-white shadow-sm">
        <AvatarFallback className={`${getClientTypeBg(client.type)} text-white text-xs font-bold`}>
          {client.companyName
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {getClientTypeIcon(client.type)}
          <span className="text-sm font-semibold text-foreground truncate">{client.companyName}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mb-1">
          {client.lastMessage || 'Aucun message'}
        </p>
        <div className="flex items-center gap-2">
          {client.lastMessageType && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${getTypeBadgeColor(client.lastMessageType)}`}>
              {getTypeIcon(client.lastMessageType)}
              {client.lastMessageType === 'whatsapp' ? 'WhatsApp' : client.lastMessageType === 'call' ? 'Appel' : client.lastMessageType === 'note' ? 'Note' : 'Message'}
            </span>
          )}
          {client.discussionCount > 0 && (
            <span className="text-[10px] text-muted-foreground">{client.discussionCount} messages</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1">
        {client.lastMessageAt && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {getTimeAgo(client.lastMessageAt)}
          </span>
        )}
        {client.status === 'lead_rouge' && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-600 border-amber-300">
            Lead Rouge
          </Badge>
        )}
      </div>
    </button>
  )
}

// ====== MESSAGE BUBBLE ======
function MessageBubble({ message }: { message: DiscussionMessage }) {
  const isOutgoing = message.direction === 'outgoing'

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] sm:max-w-[60%] rounded-xl border p-3 ${getTypeBgColor(message.type, message.direction)}`}
      >
        {/* Type indicator */}
        <div className="flex items-center gap-1.5 mb-1">
          {getTypeIcon(message.type)}
          <span className={`text-[10px] font-medium ${getTypeBadgeColor(message.type)} px-1.5 py-0.5 rounded-full`}>
            {message.type === 'whatsapp' ? 'WhatsApp' : message.type === 'call' ? 'Appel' : message.type === 'note' ? 'Note' : 'Message'}
          </span>
        </div>
        {/* Content */}
        <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
        {/* Timestamp */}
        <div className="flex items-center justify-end gap-1 mt-1.5">
          <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            <span className="text-[10px] text-muted-foreground">✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ====== MAIN PAGE ======
export default function DiscussionsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{
    data: {
      clients: ClientDiscussion[]
      discussions: DiscussionMessage[]
    }
    count: number
  }>({
    queryKey: ['discussions'],
    queryFn: () => fetch('/api/discussions').then((r) => r.json()),
  })

  const clients = data?.data?.clients || []
  const discussions = data?.data?.discussions || []

  // Filter clients by search
  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Auto-select first client using derived state pattern
  const effectiveSelectedClient = selectedClientId || (filteredClients.length > 0 ? filteredClients[0].id : null)

  // Get selected client
  const selectedClient = clients.find((c) => c.id === effectiveSelectedClient)

  // ── Send message ──
  const sendMessage = async () => {
    if (!newMessage.trim() || !effectiveSelectedClient || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: effectiveSelectedClient,
          type: 'message',
          content: newMessage.trim(),
          direction: 'outgoing',
        }),
      })
      if (res.ok) {
        setNewMessage('')
        queryClient.invalidateQueries({ queryKey: ['discussions'] })
      } else {
        toast({ title: 'Erreur', description: 'Impossible d\'envoyer le message', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Erreur lors de l\'envoi', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  // Get messages for selected client
  const clientMessages = discussions.filter((d) => d.clientId === effectiveSelectedClient)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [clientMessages.length, effectiveSelectedClient])

  return (
    <div className="h-full flex flex-col sm:h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-erp-orange" />
          Discussions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Communication avec vos clients
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col sm:flex-row gap-0 sm:gap-0 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Left Panel - Client List */}
        <div className="w-full sm:w-80 lg:w-96 shrink-0 border rounded-xl bg-card overflow-hidden flex flex-col mb-4 sm:mb-0 sm:mr-4">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Client List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))
                : filteredClients.map((client) => (
                    <ClientListItem
                      key={client.id}
                      client={client}
                      isSelected={effectiveSelectedClient === client.id}
                      onClick={() => setSelectedClientId(client.id)}
                    />
                  ))}
              {!isLoading && filteredClients.length === 0 && (
                <div className="p-8 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aucun client trouvé</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Conversation */}
        <div className="flex-1 border rounded-xl bg-card overflow-hidden flex flex-col min-h-[400px] sm:min-h-0">
          {selectedClient ? (
            <>
              {/* Client Header */}
              <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-muted/30">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarFallback className={`${getClientTypeBg(selectedClient.type)} text-white text-xs font-bold`}>
                    {selectedClient.companyName
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {selectedClient.companyName}
                    </h3>
                    {getClientTypeIcon(selectedClient.type)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedClient.contactName}</span>
                    {selectedClient.city && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {selectedClient.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedClient.phone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedClient.whatsapp && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3 sm:p-4">
                {clientMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-10 w-10 mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Aucun message</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Commencez la conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <Separator className="flex-1" />
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                        {clientMessages.length > 0
                          ? formatDate(clientMessages[0].createdAt)
                          : ''}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                    {clientMessages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 sm:p-4 border-t bg-muted/30">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nouveau message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        sendMessage()
                      }
                    }}
                    className="flex-1 h-10 text-sm"
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 bg-erp-orange hover:bg-erp-orange/90 text-white shrink-0"
                    disabled={!newMessage.trim() || sending}
                    onClick={sendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sélectionnez un client</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Choisissez un client pour voir la conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
