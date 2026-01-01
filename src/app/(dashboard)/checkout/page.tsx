"use client"

import { useState, Suspense } from "react"
export const dynamic = "force-dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Check, 
  Shield, 
  Lock,
  Zap,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardPaymentBrick } from "@/components/mercadopago"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Plan definitions - matching LP pricing
const plans = {
  solo: {
    name: "Solo",
    description: "Para desenvolvedores individuais escalando.",
    monthlyPrice: 19.90,
    yearlyPrice: 15.90 * 12, // 190.80
    features: [
      { text: "60 Endpoints", included: true },
      { text: "2 Status Pages", included: true },
      { text: "5 Min Check Interval", included: true },
      { text: "30 Dias de Retenção", included: true },
      { text: "Monitoramento SSL", included: false },
      { text: "Domínio Personalizado", included: false },
      { text: "Alertas por Email", included: false },
    ],
    popular: false,
    gradient: "from-blue-500/20 to-cyan-500/20",
    accent: "text-blue-500",
  },
  pro: {
    name: "Pro",
    description: "Tudo o que você precisa para apps em produção.",
    monthlyPrice: 39.90,
    yearlyPrice: 31.90 * 12, // 382.80
    features: [
      { text: "100 Endpoints", included: true },
      { text: "5 Status Pages", included: true },
      { text: "5 Min Check Interval", included: true },
      { text: "90 Dias de Retenção", included: true },
      { text: "Monitoramento SSL", included: true },
      { text: "Domínio Personalizado", included: true },
      { text: "Alertas por Email", included: false },
    ],
    popular: true,
    gradient: "from-primary/20 to-purple-500/20",
    accent: "text-primary",
  },
  business: {
    name: "Business",
    description: "Poder ilimitado para times em crescimento.",
    monthlyPrice: 99.90,
    yearlyPrice: 79.90 * 12, // 958.80
    features: [
      { text: "Endpoints Ilimitados", included: true },
      { text: "Status Pages Ilimitadas", included: true },
      { text: "5 Min Check Interval", included: true },
      { text: "365 Dias de Retenção", included: true },
      { text: "Monitoramento SSL", included: true },
      { text: "Domínio Personalizado", included: true },
      { text: "Alertas por Email", included: true },
      { text: "Alertas de Resposta", included: true },
    ],
    popular: false,
    gradient: "from-amber-500/20 to-orange-500/20",
    accent: "text-amber-500",
  },
}

type PlanId = keyof typeof plans

interface PaymentData {
  paymentId: string
  status: string
  statusDetail: string
  paymentMethodId: string
  transactionAmount: number
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get initial values from URL params
  const paramPlan = searchParams.get("plan")
  const paramInterval = searchParams.get("interval")
  
  // Validate plan ID (default to "pro" if invalid)
  const getValidPlanId = (plan: string | null): PlanId => {
    if (plan && plan in plans) return plan as PlanId
    // Map "free" to redirect to home
    if (plan === "free") return "solo" // They shouldn't be here for free
    return "pro"
  }
  
  const initialPlan = getValidPlanId(paramPlan)
  const initialInterval = (paramInterval === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly"
  const initialStep = (paramPlan && paramPlan !== "free" && paramPlan in plans) ? "payment" : "select"
  
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan)
  const [interval, setInterval] = useState<"monthly" | "yearly">(initialInterval)
  const [step, setStep] = useState<"select" | "payment" | "success">(initialStep)
  
  const plan = plans[selectedPlan]
  const amount = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
  const savings = interval === "yearly" 
    ? 20 // Fixed 20% like LP says
    : 0

  const [paymentStatus, setPaymentStatus] = useState<PaymentData | null>(null)

  // Calculate next billing date - use a static date to avoid impure function issues
  const getNextBillingDate = (int: "monthly" | "yearly") => {
    const days = int === "monthly" ? 30 : 365
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    return futureDate.toLocaleDateString("pt-BR")
  }
  const [nextBillingDate] = useState(() => getNextBillingDate(interval))

  const handlePaymentSuccess = (data: PaymentData) => {
    setPaymentStatus(data)
    setStep("success")
    if (data?.status === "scheduled") {
      toast.success("Mudança agendada com sucesso!")
    } else {
      toast.success("Pagamento realizado com sucesso!")
    }
  }

  const handlePaymentError = (error: string) => {
    toast.error(error || "Pagamento falhou. Por favor tente novamente.")
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (step === "success") {
    const isScheduled = paymentStatus?.status === "scheduled"
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex items-center justify-center w-full h-full bg-linear-to-br from-emerald-500 to-emerald-600 rounded-full">
              {isScheduled ? <Check className="h-12 w-12 text-white" /> : <Sparkles className="h-12 w-12 text-white" />}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{isScheduled ? "Mudança Agendada!" : "Pagamento Confirmado!"}</h1>
            <p className="text-muted-foreground">
              {isScheduled 
                ? `Sua mudança para o plano ${plan.name} ocorrerá ao final do ciclo atual.` 
                : `Bem-vindo ao plano ${plan.name}. Sua assinatura está ativa.`}
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-muted/30 border space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-medium">
                {interval === "monthly" ? formatPrice(plan.monthlyPrice) : formatPrice(plan.yearlyPrice / 12)}/mês
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{isScheduled ? "Data da mudança" : "Próxima cobrança"}</span>
              <span className="font-medium">{nextBillingDate}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push("/")}
              className="bg-linear-to-r from-primary to-primary/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isScheduled ? "Voltar ao Dashboard" : "Começar a Monitorar"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/billing")}
            >
              Ver Minha Assinatura
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step === "payment" ? setStep("select") : router.push("/billing")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {step === "select" ? "Escolha seu Plano" : "Completar Assinatura"}
            </h1>
            <p className="text-muted-foreground">
              {step === "select" 
                ? "Selecione o plano ideal para suas necessidades"
                : `Assine o plano ${plan.name}`
              }
            </p>
          </div>
        </div>

        {step === "select" ? (
          <>
            {/* Interval Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center p-1 rounded-full bg-muted/50 border">
                <Button
                  variant={interval === "monthly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInterval("monthly")}
                  className="rounded-full"
                >
                  Mensal
                </Button>
                <Button
                  variant={interval === "yearly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInterval("yearly")}
                  className="rounded-full relative"
                >
                  Anual
                  <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 border-none">
                    20% OFF
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {(Object.keys(plans) as PlanId[]).map((planId) => {
                const p = plans[planId]
                const price = interval === "monthly" ? p.monthlyPrice : p.yearlyPrice / 12
                const isSelected = selectedPlan === planId
                
                return (
                  <div
                    key={planId}
                    onClick={() => setSelectedPlan(planId)}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300",
                      "hover:shadow-xl hover:shadow-primary/5",
                      isSelected 
                        ? "border-primary bg-linear-to-br " + p.gradient
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    {p.popular && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary hover:bg-primary">Popular</Badge>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className={cn("text-xl font-bold", p.accent)}>{p.name}</h3>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      </div>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {formatPrice(price)}
                        </span>
                        <span className="text-muted-foreground">
                          /mês
                        </span>
                      </div>
                      
                      {interval === "yearly" && (
                        <p className="text-xs text-muted-foreground">
                          Faturado anualmente ({formatPrice(p.yearlyPrice)}/ano)
                        </p>
                      )}
                      
                      <div className="space-y-2 pt-4 border-t">
                        {p.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className={cn(
                              "h-4 w-4",
                              feature.included ? "text-emerald-500" : "text-muted-foreground/30"
                            )} />
                            <span className={cn(
                              feature.included ? "" : "text-muted-foreground/50 line-through"
                            )}>
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Continue Button */}
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => setStep("payment")}
                className="min-w-[200px] bg-linear-to-r from-primary to-primary/90"
              >
                Continuar com {plan.name}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-8 space-y-6">
                <div className={cn(
                  "rounded-2xl border p-6 bg-linear-to-br",
                  plan.gradient
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="mb-2 hover:bg-primary">{plan.name}</Badge>
                      <h3 className="text-2xl font-bold">{plan.description}</h3>
                    </div>
                    {plan.popular && (
                      <Badge variant="secondary">Popular</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold">
                      {formatPrice(amount)}
                    </span>
                    <span className="text-muted-foreground">
                      /{interval === "monthly" ? "mês" : "ano"}
                    </span>
                    {savings > 0 && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 ml-2 border-none text-white">
                        Economize {savings}%
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    {plan.features.filter(f => f.included).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Security badges */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border text-center">
                    <Shield className="h-6 w-6 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Pagamento Seguro</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border text-center">
                    <Lock className="h-6 w-6 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Criptografia SSL</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border text-center">
                    <Zap className="h-6 w-6 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Acesso Imediato</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Form */}
            <div className="order-1 lg:order-2">
              <div className="rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  Detalhes do Pagamento
                </h2>
                
                <CardPaymentBrick
                  amount={amount}
                  planId={selectedPlan}
                  planName={plan.name}
                  interval={interval}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Ao assinar, você concorda com nossos{" "}
                  <a href="#" className="underline hover:text-foreground">Termos de Serviço</a>
                  {" "}e{" "}
                  <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
