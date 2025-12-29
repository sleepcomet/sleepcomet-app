"use client"

import { useState } from "react"
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
    description: "For individual developers scaling up.",
    monthlyPrice: 4.99,
    yearlyPrice: 3.99 * 12, // 47.88
    features: [
      { text: "60 Endpoints", included: true },
      { text: "2 Status Pages", included: true },
      { text: "5 Min Check Interval", included: true },
      { text: "30 Days Data Retention", included: true },
      { text: "SSL Monitoring", included: false },
      { text: "Custom Domain", included: false },
      { text: "Email Alerts", included: false },
    ],
    popular: false,
    gradient: "from-blue-500/20 to-cyan-500/20",
    accent: "text-blue-500",
  },
  pro: {
    name: "Pro",
    description: "Everything you need for production apps.",
    monthlyPrice: 9.99,
    yearlyPrice: 7.99 * 12, // 95.88
    features: [
      { text: "100 Endpoints", included: true },
      { text: "5 Status Pages", included: true },
      { text: "5 Min Check Interval", included: true },
      { text: "90 Days Data Retention", included: true },
      { text: "SSL Monitoring", included: true },
      { text: "Custom Domain", included: true },
      { text: "Email Alerts", included: false },
    ],
    popular: true,
    gradient: "from-primary/20 to-purple-500/20",
    accent: "text-primary",
  },
  business: {
    name: "Business",
    description: "Unlimited power for growing teams.",
    monthlyPrice: 29.99,
    yearlyPrice: 23.99 * 12, // 287.88
    features: [
      { text: "Unlimited Endpoints", included: true },
      { text: "Unlimited Status Pages", included: true },
      { text: "5 Min Check Interval", included: true },
      { text: "365 Days Data Retention", included: true },
      { text: "SSL Monitoring", included: true },
      { text: "Custom Domain", included: true },
      { text: "Email Alerts", included: true },
      { text: "Response Alerts", included: true },
    ],
    popular: false,
    gradient: "from-amber-500/20 to-orange-500/20",
    accent: "text-amber-500",
  },
}

type PlanId = keyof typeof plans

export default function CheckoutPage() {
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

  // Calculate next billing date - use a static date to avoid impure function issues
  const getNextBillingDate = (int: "monthly" | "yearly") => {
    const days = int === "monthly" ? 30 : 365
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    return futureDate.toLocaleDateString("en-US")
  }
  const [nextBillingDate] = useState(() => getNextBillingDate(interval))

  const handlePaymentSuccess = () => {
    setStep("success")
    toast.success("Payment successful!")
  }

  const handlePaymentError = (error: string) => {
    toast.error(error || "Payment failed. Please try again.")
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full">
              <Check className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Payment Confirmed!</h1>
            <p className="text-muted-foreground">
              Welcome to the {plan.name} plan. Your subscription is now active.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-muted/30 border space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                ${interval === "monthly" ? plan.monthlyPrice.toFixed(2) : (plan.yearlyPrice / 12).toFixed(2)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next billing</span>
              <span className="font-medium">{nextBillingDate}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-primary to-primary/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start Monitoring
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/billing")}
            >
              View My Subscription
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
              {step === "select" ? "Choose Your Plan" : "Complete Subscription"}
            </h1>
            <p className="text-muted-foreground">
              {step === "select" 
                ? "Select the perfect plan for your needs"
                : `Subscribe to the ${plan.name} plan`
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
                  Monthly
                </Button>
                <Button
                  variant={interval === "yearly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInterval("yearly")}
                  className="rounded-full relative"
                >
                  Yearly
                  <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-emerald-500">
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
                        ? "border-primary bg-gradient-to-br " + p.gradient
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    {p.popular && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary">Popular</Badge>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className={cn("text-xl font-bold", p.accent)}>{p.name}</h3>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      </div>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      
                      {interval === "yearly" && (
                        <p className="text-xs text-muted-foreground">
                          Billed yearly (${p.yearlyPrice.toFixed(2)}/year)
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
                className="min-w-[200px] bg-gradient-to-r from-primary to-primary/90"
              >
                Continue with {plan.name}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-8 space-y-6">
                <div className={cn(
                  "rounded-2xl border p-6 bg-gradient-to-br",
                  plan.gradient
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="mb-2">{plan.name}</Badge>
                      <h3 className="text-2xl font-bold">{plan.description}</h3>
                    </div>
                    {plan.popular && (
                      <Badge variant="secondary">Popular</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold">
                      ${amount.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      /{interval === "monthly" ? "mo" : "year"}
                    </span>
                    {savings > 0 && (
                      <Badge className="bg-emerald-500 ml-2">
                        Save {savings}%
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
                    <span className="text-xs text-muted-foreground">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border text-center">
                    <Lock className="h-6 w-6 text-blue-500" />
                    <span className="text-xs text-muted-foreground">SSL Encrypted</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border text-center">
                    <Zap className="h-6 w-6 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Instant Access</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Form */}
            <div className="order-1 lg:order-2">
              <div className="rounded-2xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  Payment Details
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
                  By subscribing, you agree to our{" "}
                  <a href="#" className="underline hover:text-foreground">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
