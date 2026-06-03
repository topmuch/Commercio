'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Package,
  Users,
  Loader2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ── Suggestions ───────────────────────────────────────────────────────

const suggestions = [
  { id: 's1', label: 'Analyse des ventes du mois', icon: TrendingUp, color: 'text-primary' },
  { id: 's2', label: 'Produits en alerte stock', icon: Package, color: 'text-erp-warning' },
  { id: 's3', label: 'Performance des commerciaux', icon: Users, color: 'text-erp-orange' },
  { id: 's4', label: 'Prévisions de ventes', icon: TrendingUp, color: 'text-erp-success' },
  { id: 's5', label: 'Recommandations produits', icon: Lightbulb, color: 'text-chart-4' },
]

// ── Mock AI responses ──────────────────────────────────────────────────

const mockResponses: Record<string, string> = {
  'Analyse des ventes du mois': `📊 **Analyse des ventes - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}**

Voici le résumé de vos performances ce mois-ci :

1. **Chiffre d'affaires total** : 42,03 M CFA (+12.5% vs mois dernier)
2. **Nombre de commandes** : 156 commandes traitées
3. **Panier moyen** : 269 400 CFA
4. **Taux de conversion** : 68% (en hausse de 3 points)

**Points clés :**
- Les **boissons** représentent 42% du CA total
- La région de **Dakar** génère 38% des ventes
- **Abdoulaye S.** est le meilleur commercial avec 12,48 M CFA
- **12 nouveaux clients** ont été acquis ce mois

**Recommandations :**
- Augmenter le stock de Coca-Cola et Yaourt Danone (demande en hausse)
- Renforcer la couverture dans la région de Thiès (+8% de croissance)`,

  'Produits en alerte stock': `⚠️ **Alertes de stock - Produits critiques**

**Produits en rupture (stock = 0) :**
1. 🔴 Jus d'Orange Al Hamra 1L (BOI-002) — 0 unités
2. 🔴 Savon de Marseille 500g (ENT-004) — 0 unités

**Produits avec stock limité (< seuil minimum) :**
1. 🟡 Eau Javel 1L (ENT-002) — 15 unités (seuil: 30)
2. 🟡 Crème Nivea 200ml (COS-003) — 12 unités (seuil: 20)
3. 🟡 Gel Douche Palmolive (COS-004) — 8 unités (seuil: 25)
4. 🟡 Shampoo Dove 400ml (COS-001) — 18 unités (seuil: 25)

**Actions recommandées :**
- Passer commande urgente pour les produits en rupture
- Programmer un réapprovisionnement automatique pour les seuils bas
- Contacter les fournisseurs pour les délais de livraison`,

  'Performance des commerciaux': `👥 **Performance des commerciaux - Rapport mensuel**

**Classement par chiffre d'affaires :**

| # | Commercial | CA | Objectif | Atteinte |
|---|-----------|-----|----------|----------|
| 1 | Abdoulaye S. | 12,48 M CFA | 12 M CFA | ✅ 104% |
| 2 | Ibrahima F. | 11,12 M CFA | 10 M CFA | ✅ 111% |
| 3 | Mamadou D. | 9,85 M CFA | 12 M CFA | ⚠️ 82% |
| 4 | Ousmane B. | 8,84 M CFA | 10 M CFA | ⚠️ 88% |
| 5 | Fatou N. | 7,56 M CFA | 10 M CFA | ⚠️ 76% |
| 6 | Aminata D. | 6,24 M CFA | 8 M CFA | ⚠️ 78% |

**Insights :**
- **2 commerciaux** ont dépassé leur objectif
- La **progression moyenne** est de +15% vs Q3
- **Sara L.** montre la plus forte progression (+28%)
- **Formation recommandée** pour Amina D. (techniques de vente)`,

  'Prévisions de ventes': `📈 **Prévisions de ventes - Prochain trimestre**

Basé sur l'historique et les tendances actuelles :

**Mois prochain (projection) :**
- **CA estimé** : 47,4 M CFA (+12% de croissance)
- **Commandes prévues** : 175-190
- **Nouveaux clients** : ~22

**Tendances saisonnières :**
1. **Boissons** : Hausse attendue de +25% (été)
2. **Cosmétiques** : Stable avec légère hausse (+5%)
3. **Entretien** : Baisse saisonnière (-10%)
4. **Alimentation** : Stable (+2%)

**Recommandations stratégiques :**
- Augmenter le stock de boissons de 40%
- Préparer des promotions sur les cosmétiques
- Négocier de meilleurs tarifs avec les fournisseurs d'entretien
- Recruter 1 commercial supplémentaire pour la couverture Dakar`,

  'Recommandations produits': `💡 **Recommandations produits - Intelligence de marché**

**Produits à ajouter au catalogue :**
1. **Huile de table 5L** — Forte demande détectée (+35% de recherche)
2. **Café moulu 250g** — Catégorie en croissance
3. **Moutarde 500g** — Produit complémentaire à la gamme entretien

**Produits à promouvoir :**
1. ⭐ Coca-Cola 33cl — Meilleur vendeur, potentiel cross-selling
2. ⭐ Semoule 5kg — Marge élevée (32%)
3. ⭐ Harissa CPL — Tendance montante

**Stratégie de prix :**
- **Ajuster les prix** de 5 produits face à la concurrence
- **Offres groupées** pour augmenter le panier moyen
- **Remise fidélité** pour les clients gros volumes

**Analyse concurrentielle :**
- Votre prix moyen est **8% en dessous** du marché
- Opportunité d'augmentation sur les marques premium
- 3 produits identifiés comme "price fighters"`,

  default: `🤖 **DistribuAI - Assistant intelligent**

Merci pour votre question. Voici ce que je peux vous dire :

1. J'ai analysé vos données récentes
2. Les tendances indiquent une **croissance positive** de votre activité
3. Je vous recommande de consulter le tableau de bord pour plus de détails

**Ce que je peux faire pour vous :**
- 📊 Analyse des ventes et performance
- 📦 Gestion du stock et alertes
- 👥 Suivi des commerciaux
- 📈 Prévisions et tendances
- 💡 Recommandations stratégiques

N'hésitez pas à me poser une question plus spécifique !`,
}

function getMockResponse(message: string): string {
  // Find the closest matching suggestion
  for (const [key, value] of Object.entries(mockResponses)) {
    if (key === 'default') continue
    if (message.toLowerCase().includes(key.toLowerCase().split(' ')[0].toLowerCase()) ||
        message.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }
  return mockResponses['default']
}

// ── Markdown-like renderer ────────────────────────────────────────────

function renderFormattedText(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    // Bold: **text**
    let renderedLine: React.ReactNode = line

    // Check if line is bold header (starts with **)
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-bold text-foreground mt-3 mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      )
      return
    }

    // Process inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    if (parts.length > 1) {
      renderedLine = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-foreground">{part.replace(/\*\*/g, '')}</strong>
        }
        return <span key={j}>{part}</span>
      })
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 my-0.5">
          <span className="text-primary font-semibold shrink-0">{numberedMatch[1]}.</span>
          <span className="text-foreground/90">{renderedLine as React.ReactNode}</span>
        </div>
      )
      return
    }

    // Bullet points (starts with -)
    if (line.trimStart().startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 my-0.5">
          <span className="text-erp-orange shrink-0">•</span>
          <span className="text-foreground/90">{line.replace(/^-\s+/, '')}</span>
        </div>
      )
      return
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
      return
    }

    // Regular text
    elements.push(
      <p key={i} className="text-foreground/90 my-0.5">{renderedLine}</p>
    )
  })

  return elements
}

// ── Chat Message Component ────────────────────────────────────────────

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <Avatar className={`h-8 w-8 shrink-0 mt-0.5 ${isAssistant ? '' : ''}`}>
        <AvatarFallback className={
          isAssistant
            ? 'bg-primary text-primary-foreground text-xs font-bold'
            : 'bg-erp-orange text-white text-xs font-bold'
        }>
          {isAssistant ? 'AI' : 'U'}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] ${isAssistant ? '' : 'text-right'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAssistant
              ? 'bg-muted text-foreground rounded-tl-sm'
              : 'bg-primary text-primary-foreground rounded-tr-sm'
          }`}
        >
          {isAssistant ? renderFormattedText(message.content) : message.content}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Bienvenue sur DistribuAI !**

Je suis votre assistant intelligent pour la gestion de votre activité de distribution. Je peux vous aider avec :

1. 📊 **Analyse des ventes** — Suivi et statistiques en temps réel
2. 📦 **Gestion du stock** — Alertes et recommandations
3. 👥 **Performance commerciale** — Suivi des équipes
4. 📈 **Prévisions** — Tendances et projections
5. 💡 **Recommandations** — Optimisation stratégique

Cliquez sur une suggestion ci-dessous ou tapez votre question pour commencer.`,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response after delay
    const delay = 1000 + Math.random() * 1000
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: getMockResponse(text.trim()),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, delay)
  }, [isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* ── AI Branding ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-erp-blue text-white shadow-md">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-foreground flex items-center gap-1.5">
            DistribuAI
            <Sparkles className="h-4 w-4 text-erp-orange" />
          </h2>
          <p className="text-xs text-muted-foreground">Assistant intelligent pour la distribution</p>
        </div>
        <Badge variant="secondary" className="ml-auto bg-erp-success/10 text-erp-success text-xs gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-erp-success animate-pulse" />
          En ligne
        </Badge>
      </div>

      {/* ── Chat Area ────────────────────────────────────── */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 px-1" ref={scrollRef}>
          <div className="space-y-4 p-4">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    DistribuAI réfléchit...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Suggestions ───────────────────────────────── */}
        {messages.length <= 1 && !isLoading && (
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Suggestions rapides
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSend(s.label)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border/50"
                  >
                    <Icon className={`h-3 w-3 ${s.color}`} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Input Area ──────────────────────────────────── */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Posez votre question..."
              className="flex-1 h-10"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            DistribuAI peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </Card>
    </div>
  )
}
