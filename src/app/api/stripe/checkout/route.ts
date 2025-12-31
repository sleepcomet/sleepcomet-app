import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanType } from "@/config/plans";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { plan, interval = 'monthly' } = await req.json(); // Default to monthly
    const selectedPlan = PLANS[plan.toUpperCase() as PlanType];

    if (!selectedPlan) {
      console.error("[STRIPE_CHECKOUT] Invalid Plan:", plan);
       return new NextResponse("Invalid Plan", { status: 400 });
    }

    const priceId = interval === 'yearly' ? selectedPlan.priceIds.yearly : selectedPlan.priceIds.monthly;

    if (!priceId && selectedPlan.priceIds.monthly !== '') { 
      // If selected interval price is missing but plan is not free (assuming free has empty string for monthly)
      // Actually free plan has empty strings for both.
      // If it's a paid plan, priceId must exist.
      if (selectedPlan.slug !== 'free') {
          console.error("[STRIPE_CHECKOUT] Price ID missing for plan:", plan, "interval:", interval);
          return new NextResponse("Price ID missing for selected interval", { status: 400 });
      }
    }
    
    // If free plan, just update DB and return (no stripe session needed usually, or handle downgrade)
    if (selectedPlan.slug === 'free') {
         await prisma.subscription.update({
            where: { userId: session.user.id },
            data: {
                plan: "FREE",
                status: "active",
                mpCustomerId: null,
                mpCardLastFour: null,
                mpCardBrand: null,
                mpPaymentMethodId: null,
                currentPeriodEnd: null,
                nextBillingDate: null,
                autoRenew: false
            }
         });
         return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing` });
    }

    // This route is deprecated - use Mercado Pago subscription route instead
    const dbSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Check if user already has an ACTIVE subscription
    // Note: This Stripe route is deprecated - use Mercado Pago route instead
    if (dbSubscription?.mpPaymentMethodId && dbSubscription.plan !== "FREE") {
      // For Mercado Pago, we check subscription status differently
      // This route should not be used - redirect to billing
        
        if (dbSubscription.status === 'active') {
          // User already has an active subscription - redirect to billing
          return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing` });
        }
    }

    // This Stripe route is deprecated - users should use the Mercado Pago route
    // Redirect to billing page
    return NextResponse.json({ 
      error: "This payment method is no longer supported. Please use Mercado Pago.",
      url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing` 
    }, { status: 400 });

    // This code should never be reached due to the return above
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
