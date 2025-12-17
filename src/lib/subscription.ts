import { prisma } from "@/lib/prisma";
import { PLANS, PlanType, getPlanByPriceId } from "@/config/plans";
import { stripe } from "@/lib/stripe";

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return null;

  // Sync with Stripe if we have a subscription ID
  if (subscription.stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      
      // Check if plan matches
      const priceId = stripeSub.items.data[0].price.id;
      const plan = getPlanByPriceId(priceId);
      
      // If plan is active and different from DB, or if status changed (e.g. canceled)
      const isActive = stripeSub.status === 'active' || stripeSub.status === 'trialing';
      
      if (isActive && plan && plan !== subscription.plan) {
         console.log(`[SYNC] Updating user ${userId} plan from ${subscription.plan} to ${plan}`);
         await prisma.subscription.update({
             where: { userId },
             data: {
                 plan: plan,
                 stripePriceId: priceId,
                 stripeCurrentPeriodEnd: new Date((stripeSub as unknown as { current_period_end: number }).current_period_end * 1000)
             }
         });
         // Update local object to return fresh data
         subscription.plan = plan;
      } else if (!isActive && subscription.plan !== 'FREE' && stripeSub.status !== 'past_due') {
          // If subscription is not active (canceled, unpaid) and DB says it is paid
          // Note: 'past_due' might still allow access depending on logic, but usually we want to keep it until fully canceled.
          // Let's be conservative: only downgrade if canceled or unpaid
          if (stripeSub.status === 'canceled' || stripeSub.status === 'unpaid') {
             console.log(`[SYNC] Downgrading user ${userId} due to status ${stripeSub.status}`);
             await prisma.subscription.update({
                 where: { userId },
                 data: {
                     plan: 'FREE',
                     stripeCurrentPeriodEnd: null
                 }
             });
             subscription.plan = 'FREE';
          }
      }
      
    } catch (error) {
        console.error("Error syncing subscription with Stripe:", error);
    }
  }

  const planKey = (subscription.plan || "FREE").toUpperCase() as PlanType;
  const plan = PLANS[planKey] || PLANS.FREE;

  return {
    ...subscription,
    plan: plan,
  };
}

export async function getUserPlanUsage(userId: string) {
  // We call getUserSubscription to ensure sync happens
  const [subscription, endpointsCount, statusPagesCount] = await Promise.all([
    getUserSubscription(userId),
    prisma.endpoint.count({ where: { userId } }),
    prisma.statusPage.count({ where: { userId } }),
  ]);

  // Fallback if subscription is null (shouldn't happen for created users usually)
  const plan = subscription?.plan || PLANS.FREE;

  return {
    plan,
    usage: {
      endpoints: endpointsCount,
      statusPages: statusPagesCount,
    },
    limits: plan.limits,
  };
}
