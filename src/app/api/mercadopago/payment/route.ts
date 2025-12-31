import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { PLANS, PlanType, getPlanKeyBySlug } from "@/config/plans"

// CORS headers for cross-origin requests from LP
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3001",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const { token, planId, interval = "monthly", payer } = body
    
    // Token is required for payment
    if (!token || !planId) {
      return NextResponse.json(
        { error: "Missing required fields: token, planId" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate CPF
    const cpf = payer?.identification?.number?.replace(/\D/g, "")
    if (!cpf || cpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido. Por favor, forneça um CPF válido com 11 dígitos." },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log("[PAYMENT] Processing payment with CPF:", cpf)

    // Get plan configuration
    const planKey = getPlanKeyBySlug(planId) || (planId.toUpperCase() as PlanType)
    const selectedPlan = PLANS[planKey]

    if (!selectedPlan) {
      console.error("[PAYMENT] Invalid Plan:", planId)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400, headers: corsHeaders })
    }

    // If free plan, just update DB
    if (selectedPlan.slug === "free") {
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: "FREE",
          status: "active",
          interval: "monthly",
        },
        update: {
          plan: "FREE",
          status: "active",
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      })
      return NextResponse.json({ 
        success: true, 
        message: "Plan updated to free" 
      }, { headers: corsHeaders })
    }

    const mp = getMercadoPagoClient()
    
    // Proration Logic
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    // Get price based on interval
    let amount: number = interval === "yearly" 
      ? selectedPlan.prices.yearly 
      : selectedPlan.prices.monthly
    
    // Calculate proration
    const { credit, finalAmount, excessCredit } = await import("@/lib/billing").then(m => m.calculateProration(existingSubscription, amount));
    amount = finalAmount;

    // Calculate subscription dates
    const now = new Date()
    const periodEnd = new Date()
    
    // Add standard 1 period
    if (interval === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Add extra periods if huge credit exists (e.g. Annual -> Monthly)
    if (excessCredit > 0) {
       const basePrice = interval === "yearly" ? selectedPlan.prices.yearly : selectedPlan.prices.monthly;
       if (basePrice > 0) {
         const extraPeriods = Math.floor(excessCredit / basePrice);
         if (extraPeriods > 0) {
            if (interval === "yearly") {
              periodEnd.setFullYear(periodEnd.getFullYear() + extraPeriods);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + extraPeriods);
            }
         }
       }
    }

    // Get or create customer
    let customerId: string | null = null
    if (existingSubscription?.mpCustomerId) {
      customerId = existingSubscription.mpCustomerId
    } else {
      // Search for existing customer
      const customerSearch = await mp.searchCustomer(session.user.email)
      
      if (customerSearch.results.length > 0) {
        customerId = customerSearch.results[0].id
      } else {
        // Create new customer
        const newCustomer = await mp.createCustomer({
          email: session.user.email,
          first_name: session.user.name?.split(" ")[0] || undefined,
          last_name: session.user.name?.split(" ").slice(1).join(" ") || undefined,
        })
        customerId = newCustomer.id
      }
    }

    // Handle Payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payment: any = {
      id: "credit_" + crypto.randomUUID(),
      status: "approved",
      status_detail: "accredited",
      card: { last_four_digits: "****" },
      payment_method_id: "credit_applied"
    };

    // If there is a positive amount to charge, use Mercado Pago
    if (amount > 0) {
        payment = await mp.createPayment({
          transaction_amount: amount,
          description: `${selectedPlan.name} - ${interval === "yearly" ? "Anual" : "Mensal"} (Crédito aplicado: R$ ${credit.toFixed(2)})`,
          token: token,
          installments: 1,
          payer: {
            email: payer?.email || session.user.email,
            identification: {
              type: "CPF",
              number: cpf,
            },
          },
        })
    }

    // Extract card info from payment response
    const cardLastFour = payment.card?.last_four_digits || ""

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan: planKey,
        status: payment.status === "approved" ? "active" : "past_due",
        interval: interval,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
        lastPaymentDate: payment.status === "approved" ? now : null,
        lastPaymentAmount: amount,
        mpCustomerId: customerId,
        mpCardLastFour: cardLastFour,
        mpCardBrand: payment.payment_method_id,
        mpPaymentMethodId: null, // Will save card on first renewal
        autoRenew: true,
      },
      update: {
        plan: planKey,
        status: payment.status === "approved" ? "active" : "past_due",
        interval: interval,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
        lastPaymentDate: payment.status === "approved" ? now : null,
        lastPaymentAmount: amount,
        mpCustomerId: customerId,
        mpCardLastFour: cardLastFour,
        mpCardBrand: payment.payment_method_id,
        mpPaymentMethodId: null, // Will save card on first renewal
        autoRenew: true,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
    })

    // Record payment
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: amount,
        currency: "BRL",
        status: payment.status,
        interval: interval,
        mpPaymentId: String(payment.id),
        mpStatus: payment.status,
        mpStatusDetail: payment.status_detail,
        description: `${selectedPlan.name} - ${interval === "yearly" ? "Anual" : "Mensal"}`,
        paidAt: payment.status === "approved" ? now : null,
      },
    })

    if (payment.status !== "approved") {
      return NextResponse.json({
        error: `Pagamento ${payment.status}: ${payment.status_detail}`,
      }, { status: 400, headers: corsHeaders })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: amount,
      },
      subscription: {
        plan: planKey,
        interval: interval,
        currentPeriodEnd: periodEnd.toISOString(),
      },
    }, { headers: corsHeaders })
  } catch (error) {
    console.error("[PAYMENT]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
