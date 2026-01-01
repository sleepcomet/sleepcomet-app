"use client"

import { Check, Zap, Rocket, Shield, Clock } from "lucide-react"
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PLANS } from "@/config/plans"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: typeof PLANS[keyof typeof PLANS]
}

export function UpgradeModal({
  open,
  onOpenChange,
  plan = PLANS.SOLO
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const price = billingCycle === 'monthly' ? plan.prices.monthly : plan.prices.yearly
  const yearlyTotal = plan.prices.yearly * 12

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        <div className="bg-primary p-8 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-none mb-4 backdrop-blur-md">
                RECOMENDADO
              </Badge>
              <DialogTitle className="text-3xl font-bold">Upgrade para {plan.name.replace(" Plan", "")}</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-base max-w-[90%]">
                Turbine seu monitoramento com recursos avançados projetados para profissionais e projetos em crescimento.
              </DialogDescription>
            </div>
            <div className="h-16 w-16 bg-primary-foreground/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-primary-foreground/20">
              <Rocket className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="p-8 bg-background">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Coluna de Preço - Largura flexível com mínimo */}
            <div className="flex-none w-full md:w-auto md:min-w-[220px] space-y-6">
              {/* Billing Toggle */}
              <div className="flex items-center gap-3">
                <Label htmlFor="billing-toggle" className={`text-sm cursor-pointer ${billingCycle === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  Mensal
                </Label>
                <Switch
                  id="billing-toggle"
                  checked={billingCycle === "yearly"}
                  onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
                />
                <Label htmlFor="billing-toggle" className={`text-sm cursor-pointer ${billingCycle === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  Anual
                </Label>
              </div>

              <div>
                <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-2">Seu Investimento</p>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-4xl font-bold text-foreground tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(billingCycle === 'yearly' ? yearlyTotal : price)}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    / {billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>

                {billingCycle === 'yearly' && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-foreground/80 font-medium">
                      Equivalente a <span className="text-foreground font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}</span>/mês
                    </p>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200 dark:border-green-900 dark:text-green-400">
                      Economia de 20% inclusa
                    </Badge>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  Sem fidelidade.<br/>Cancele quando quiser.
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <p className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Tudo em {plan.name.replace(" Plan", "")}</p>
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {plan.limits.endpoints === Infinity ? "Ilimitados" : plan.limits.endpoints} Endpoints
                    </p>
                    <p className="text-sm text-muted-foreground">Monitore quantos serviços precisar sem limites.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Intervalo de Verificação de {plan.limits.checkInterval} minutos</p>
                    <p className="text-sm text-muted-foreground">Receba alertas mais rápidos com monitoramento de alta frequência.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Retenção de Dados de {plan.limits.retention || 30} dias</p>
                    <p className="text-sm text-muted-foreground">Analise tendências de desempenho histórico.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/50 p-6 flex-row items-center justify-between sm:justify-between border-t gap-4">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/pricing`} target="_blank" rel="noopener noreferrer">
              Ver todos os planos
            </a>
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Talvez Depois
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/pricing`} target="_blank" rel="noopener noreferrer">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade para {plan.name.replace(" Plan", "")}
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
