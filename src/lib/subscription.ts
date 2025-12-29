import { prisma } from "@/lib/prisma"
import { PLANS, PlanType } from "@/config/plans"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"

// Type for subscription with MP fields (until Prisma migration is run)
type SubscriptionWithMP = {
  id: string
  userId: string
  plan: string
  mpCustomerId?: string | null
  mpPreapprovalId?: string | null
  mpPaymentMethodId?: string | null
  mpCardLastFour?: string | null
  mpCardBrand?: string | null
  mpCurrentPeriodEnd?: Date | null
  mpStatus?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  stripeCurrentPeriodEnd?: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function getUserSubscription(userId: string) {
  const rawSubscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!rawSubscription) return null

  // Cast to include MP fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = rawSubscription as any as SubscriptionWithMP

  // Sync with Mercado Pago if we have a subscription ID
  if (subscription.mpPreapprovalId) {
    try {
      const mp = getMercadoPagoClient()
      const mpSub = await mp.getPreapproval(subscription.mpPreapprovalId)

      // Check if status changed
      const isCancelled = mpSub.status === "cancelled"

      // Update status if changed
      if (mpSub.status !== subscription.mpStatus) {
        console.log(
          `[SYNC] Updating user ${userId} MP status from ${subscription.mpStatus} to ${mpSub.status}`
        )

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
          mpStatus: mpSub.status,
        }

        // If cancelled and period ended, downgrade to free
        if (
          isCancelled &&
          subscription.mpCurrentPeriodEnd &&
          new Date(subscription.mpCurrentPeriodEnd) < new Date()
        ) {
          updateData.plan = "FREE"
          updateData.mpCurrentPeriodEnd = null
        }

        // Update next payment date
        if (mpSub.next_payment_date) {
          updateData.mpCurrentPeriodEnd = new Date(mpSub.next_payment_date)
        }

        await prisma.subscription.update({
          where: { userId },
          data: updateData,
        })

        // Update local object
        subscription.mpStatus = mpSub.status
        if (updateData.plan) {
          subscription.plan = updateData.plan
        }
      }
    } catch (error) {
      console.error("Error syncing subscription with Mercado Pago:", error)
    }
  }

  const planKey = (subscription.plan || "FREE").toUpperCase() as PlanType
  const plan = PLANS[planKey] || PLANS.FREE

  return {
    ...subscription,
    plan: plan,
  }
}

export async function getUserPlanUsage(userId: string) {
  // We call getUserSubscription to ensure sync happens
  const [subscription, endpointsCount, statusPagesCount] = await Promise.all([
    getUserSubscription(userId),
    prisma.endpoint.count({ where: { userId } }),
    prisma.statusPage.count({ where: { userId } }),
  ])

  // Fallback if subscription is null (shouldn't happen for created users usually)
  const plan = subscription?.plan || PLANS.FREE

  return {
    plan,
    usage: {
      endpoints: endpointsCount,
      statusPages: statusPagesCount,
    },
    limits: plan.limits,
  }
}

// Helper to check if user can use a feature
export async function canUserUseFeature(
  userId: string,
  feature: keyof typeof PLANS.FREE.features
): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  const plan = subscription?.plan || PLANS.FREE
  return plan.features[feature] === true
}

// Helper to check if user can add more of a resource
export async function canUserAdd(
  userId: string,
  resource: "endpoints" | "statusPages"
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const { usage, limits } = await getUserPlanUsage(userId)
  const current = usage[resource]
  const limit = limits[resource]
  
  return {
    allowed: current < limit,
    current,
    limit,
  }
}
