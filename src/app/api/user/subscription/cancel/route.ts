import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await req.json().catch(() => ({}))

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription) {
       return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Instead of cancelling immediately, we schedule functionality to end at period end
    // As per user request: "quando cancelar tambem, cancelamos paramos de fazer cobranças no cartao e esperamos ate o dia do plano acabar"
    
    // If it's already free or cancelled, do nothing
    if (subscription.plan === "FREE" || subscription.status === "cancelled") {
        return NextResponse.json({ message: "Subscription already inactive" })
    }

    // Set autoRenew to false and cancelAtPeriodEnd to true
    // The cron job will handle the status update to 'cancelled' when the date is reached
    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            cancelAtPeriodEnd: true,
            autoRenew: false,
            // We clear any pending plan changes if they decide to cancel instead
            pendingPlan: null, 
            pendingInterval: null
        }
    })

    return NextResponse.json({ 
        success: true, 
        message: "Assinatura será cancelada ao final do período atual.",
        endDate: subscription.currentPeriodEnd
    })

  } catch (error) {
    console.error("[SUBSCRIPTION_CANCEL]", error)
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}
