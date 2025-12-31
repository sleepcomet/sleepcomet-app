import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { PLANS, PlanType } from "@/config/plans"

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

    if (!subscription) {
      return NextResponse.json({ 
        success: true, 
        data: null 
      })
    }

    const planKey = (subscription.plan || "FREE") as PlanType
    const plan = PLANS[planKey] || PLANS.FREE


    // If cancelled and period ended, ensure we treat as expired/free if not updated by cron yet?
    // The cron runs daily. But for display:

    return NextResponse.json({
      success: true,
      data: {
        id: subscription.id,
        planName: plan.name,
        status: subscription.status, // "active", "past_due", etc.
        amount: subscription.lastPaymentAmount || (subscription.interval === "yearly" ? plan.prices.yearly : plan.prices.monthly),
        interval: subscription.interval,
        nextBillingDate: subscription.nextBillingDate?.toISOString() || subscription.currentPeriodEnd?.toISOString(),
        cardLast4: subscription.mpCardLastFour || undefined,
        cardBrand: subscription.mpCardBrand || undefined,
        startDate: subscription.createdAt.toISOString(),
        endDate: subscription.cancelAtPeriodEnd 
          ? subscription.currentPeriodEnd?.toISOString() 
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
