import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { toSubscriptionWithMP } from "@/lib/mercadopago/shared-types"
import { PLANS, PlanType, getPlanKeyBySlug } from "@/config/plans"

// CORS headers for cross-origin requests from LP
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_WEBSITE_URL || "*",
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
    
    // Token is required for transparent checkout
    if (!token || !planId) {
      return NextResponse.json(
        { error: "Missing required fields: token, planId" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get plan configuration
    const planKey = getPlanKeyBySlug(planId) || (planId.toUpperCase() as PlanType)
    const selectedPlan = PLANS[planKey]

    if (!selectedPlan) {
      console.error("[MP_SUBSCRIPTION] Invalid Plan:", planId)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // If free plan, just update DB
    if (selectedPlan.slug === "free") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: "FREE",
        } as any,
        update: {
          plan: "FREE",
          mpPreapprovalId: null,
          mpCurrentPeriodEnd: null,
          mpStatus: null,
        } as any,
      })
      return NextResponse.json({ 
        success: true, 
        message: "Plan updated to free" 
      })
    }

    const mp = getMercadoPagoClient()

    // Get price based on interval
    const amount = interval === "yearly" 
      ? selectedPlan.prices.yearly 
      : selectedPlan.prices.monthly

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    if (interval === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    // Get or create customer
    let customerId: string | null = null
    const rawSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })
    const dbSubscription = toSubscriptionWithMP(rawSubscription)

    if (dbSubscription?.mpCustomerId) {
      customerId = dbSubscription.mpCustomerId
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

    // Check for existing active subscription
    if (dbSubscription?.mpPreapprovalId && dbSubscription.mpStatus === "authorized") {
      // Cancel old subscription first
      try {
        await mp.updatePreapproval(dbSubscription.mpPreapprovalId, {
          status: "cancelled",
        })
      } catch (err) {
        console.error("Error cancelling old subscription:", err)
      }
    }

    // Create the preapproval (subscription)
    const preapproval = await mp.createPreapproval({
      reason: `${selectedPlan.name} - ${interval === "yearly" ? "Anual" : "Mensal"}`,
      external_reference: session.user.id,
      payer_email: payer?.email || session.user.email,
      card_token_id: token,
      auto_recurring: {
        frequency: interval === "yearly" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
        start_date: startDate.toISOString(),
      },
      back_url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing`, // Not used in transparent flow usually
      status: "authorized",
    })

    // Get card info from token if present
    let cardLastFour = ""
    let cardBrand = ""
    
    if (token) {
      try {
        const cardInfo = await mp.getCardToken(token)
        cardLastFour = cardInfo.last_four_digits
        cardBrand = cardInfo.first_six_digits
      } catch (err) {
        console.error("Error getting card info:", err)
      }
    }

    // Save to database
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan: planKey,
        mpCustomerId: customerId,
        mpPreapprovalId: preapproval.id,
        mpPaymentMethodId: preapproval.payment_method_id,
        mpCardLastFour: cardLastFour,
        mpCardBrand: cardBrand,
        mpCurrentPeriodEnd: endDate,
        mpStatus: preapproval.status,
      },
      update: {
        plan: planKey,
        mpCustomerId: customerId,
        mpPreapprovalId: preapproval.id,
        mpPaymentMethodId: preapproval.payment_method_id,
        mpCardLastFour: cardLastFour,
        mpCardBrand: cardBrand,
        mpCurrentPeriodEnd: endDate,
        mpStatus: preapproval.status,
      },
    })

    return NextResponse.json({
      success: true,
      id: preapproval.id,
      status: preapproval.status,
      init_point: preapproval.init_point, // URL for redirect flow
      next_payment_date: preapproval.next_payment_date,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error("[MP_SUBSCRIPTION]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
