import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { PLANS, PlanType } from "@/config/plans"

// Map MP status to our normalized status
function mapMpStatus(mpStatus: string): "active" | "paused" | "cancelled" | "pending" | "expired" {
  switch (mpStatus) {
    case "authorized":
      return "active"
    case "paused":
      return "paused"
    case "cancelled":
      return "cancelled"
    case "pending":
      return "pending"
    default:
      return "pending"
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription || !subscription.mpPreapprovalId) {
      return NextResponse.json({ 
        success: true, 
        data: null 
      })
    }

    // Optionally sync with MP API
    let mpData = null
    if (subscription.mpPreapprovalId) {
      try {
        const mp = getMercadoPagoClient()
        mpData = await mp.getPreapproval(subscription.mpPreapprovalId)
        
        // Sync status if changed
        if (mpData.status !== subscription.mpStatus) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              mpStatus: mpData.status,
              // If cancelled and period ended, downgrade to free
              ...(mpData.status === "cancelled" && 
                  subscription.mpCurrentPeriodEnd && 
                  new Date(subscription.mpCurrentPeriodEnd) < new Date() 
                ? { plan: "FREE" } 
                : {}
              ),
            },
          })
        }
      } catch (err) {
        console.error("Error syncing with MP:", err)
      }
    }

    const planKey = (subscription.plan || "FREE") as PlanType
    const plan = PLANS[planKey] || PLANS.FREE
    const status = mpData?.status || subscription.mpStatus || "active"

    return NextResponse.json({
      success: true,
      data: {
        id: subscription.mpPreapprovalId,
        planName: plan.name,
        status: mapMpStatus(status),
        amount: mpData?.auto_recurring?.transaction_amount || plan.prices.monthly,
        interval: mpData?.auto_recurring?.frequency === 12 ? "yearly" : "monthly",
        nextBillingDate: mpData?.next_payment_date || subscription.mpCurrentPeriodEnd?.toISOString(),
        cardLast4: subscription.mpCardLastFour || undefined,
        cardBrand: subscription.mpCardBrand || undefined,
        startDate: subscription.createdAt.toISOString(),
        endDate: subscription.mpStatus === "cancelled" 
          ? subscription.mpCurrentPeriodEnd?.toISOString() 
          : undefined,
      },
    })
  } catch (error) {
    console.error("[MP_GET_SUBSCRIPTION]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
