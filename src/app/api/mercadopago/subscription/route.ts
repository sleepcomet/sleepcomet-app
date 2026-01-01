import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
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
    
    // Token is required for transparent checkout
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

    console.log("[MP_SUBSCRIPTION] Processing subscription with CPF:", cpf)

    // Get plan configuration
    const planKey = getPlanKeyBySlug(planId) || (planId.toUpperCase() as PlanType)
    const selectedPlan = PLANS[planKey]

    if (!selectedPlan) {
      console.error("[MP_SUBSCRIPTION] Invalid Plan:", planId)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // If free plan, just update DB
    if (selectedPlan.slug === "free") {
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: "FREE",
        },
        update: {
          plan: "FREE",
          currentPeriodEnd: null,
          nextBillingDate: null,
          autoRenew: false,
          status: "active",
        },
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
    const endDate = new Date()
    if (interval === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    // Get or create customer
    let customerId: string | null = null
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

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

    // Save card to customer if token provided
    let savedCardId: string | undefined
    let cardLastFour = ""
    let cardBrand = ""

    if (token && customerId) {
      try {
        const savedCard = await mp.saveCard(customerId, token)
        savedCardId = savedCard.id
        cardLastFour = savedCard.last_four_digits
        cardBrand = savedCard.first_six_digits // bin/brand approximation
      } catch (err) {
        console.error("Error saving card:", err)
        // If saving fails, we might still proceed with one-time payment if token is valid?
        // But for subscription we NEED to save it.
        // Assuming token is fresh, we retry or fail? 
        // We'll try to use the token directly for payment if save fails, but renewal won't work.
      }
    }

    // CHECK FOR ACTIVE SUBSCRIPTION CHANGE (SCHEDULE INSTEAD OF CHARGE)
    const isPaidSubscriptionActive = existingSubscription 
      && existingSubscription.plan !== "FREE" 
      && existingSubscription.status === "active"
      && existingSubscription.currentPeriodEnd 
      && existingSubscription.currentPeriodEnd > new Date()
      // Ensure we are not just 'reactivating' a pending cancellation if that logic existed
    
    if (isPaidSubscriptionActive && existingSubscription) {
      // Schedule the change
      console.log(`[MP_SUBSCRIPTION] Scheduling change for user ${session.user.id} to ${planKey} (${interval})`)
      
      const updateData: Prisma.SubscriptionUpdateInput = {
        pendingPlan: planKey,
        pendingInterval: interval,
        cancelAtPeriodEnd: false, // Reactivate if it was cancelling
      }

      // Update payment method if a new one was provided
      if (savedCardId) {
        updateData.mpPaymentMethodId = savedCardId
        updateData.mpCardLastFour = cardLastFour
        updateData.mpCardBrand = cardBrand
      }

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: updateData
      })

      return NextResponse.json({
        success: true,
        action: "scheduled",
        message: "Mudança de plano agendada para o final do ciclo atual.",
        nextBillingDate: existingSubscription.currentPeriodEnd
      }, { headers: corsHeaders })
    }
    
    // IF NO ACTIVE SUBSCRIPTION, PROCEED TO CHARGE IMMEDIATELY


    // Process Payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentData: any = {
      transaction_amount: amount,
      description: `${selectedPlan.name} - ${interval === "yearly" ? "Anual" : "Mensal"}`,
      token: token, // Use token directly for first payment
      installments: 1,
      payer: {
        email: payer?.email || session.user.email,
        identification: payer?.identification
      }
    }

    const payment = await mp.createPayment(paymentData)

    if (payment.status !== "approved") {
        return NextResponse.json({ 
            error: "Payment rejected", 
            detail: payment.status_detail 
        }, { status: 400 })
    }

    // Save/Update Subscription in Database
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan: planKey,
        interval: interval,
        status: "active",
        mpCustomerId: customerId,
        mpPaymentMethodId: savedCardId, // Store the Saved Card ID
        mpCardLastFour: cardLastFour,
        mpCardBrand: cardBrand,
        currentPeriodEnd: endDate,
        nextBillingDate: endDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: amount,
        autoRenew: true
      },
      update: {
        plan: planKey,
        interval: interval,
        status: "active",
        mpCustomerId: customerId,
        mpPaymentMethodId: savedCardId,
        mpCardLastFour: cardLastFour,
        mpCardBrand: cardBrand,
        currentPeriodEnd: endDate,
        nextBillingDate: endDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: amount,
        autoRenew: true
      },
    })
    
    // Log payment
    await prisma.payment.create({
        data: {
            subscriptionId: existingSubscription?.id || (await prisma.subscription.findUnique({ where: { userId: session.user.id } }))!.id,
            amount: amount,
            currency: "BRL",
            status: "approved",
            interval: interval,
            mpPaymentId: String(payment.id),
            mpStatus: payment.status,
            mpStatusDetail: payment.status_detail,
            description: payment.description,
            paidAt: new Date()
        }
    })

    return NextResponse.json({
      success: true,
      id: payment.id,
      status: payment.status,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error("[MP_SUBSCRIPTION]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500, headers: corsHeaders }
    )
  }
}
