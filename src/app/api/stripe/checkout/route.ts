import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
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
                stripePriceId: null,
                stripeSubscriptionId: null,
                stripeCurrentPeriodEnd: null
            }
         });
         return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing` });
    }


    // Get or create subscription record to find stripeCustomerId if exists
    const dbSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Check if user already has an ACTIVE subscription
    if (dbSubscription?.stripeSubscriptionId && dbSubscription.plan !== "FREE") {
      try {
        const existingSub = await stripe.subscriptions.retrieve(dbSubscription.stripeSubscriptionId);
        
        if (existingSub.status === 'active' || existingSub.status === 'trialing') {
          // If the user is trying to subscribe to the SAME plan they already have
          if (dbSubscription.plan === selectedPlan.slug.toUpperCase()) {
             // Redirect to billing portal instead of creating a duplicate sub
             // We can create a billing portal session and redirect there
             const portalSession = await stripe.billingPortal.sessions.create({
                customer: dbSubscription.stripeCustomerId!,
                return_url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing`,
             });
             return NextResponse.json({ url: portalSession.url });
          }
          
          // If they are trying to SWITCH plans (upgrade/downgrade), we should ideally use the billing portal or handle upgrade.
          // For simplicity in this implementation, we redirect to billing portal to manage subscription.
          // Or we could cancel the old one and create new, but that's messy.
          // Safest bet: Redirect to billing portal for management.
           const portalSession = await stripe.billingPortal.sessions.create({
              customer: dbSubscription.stripeCustomerId!,
              return_url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing`,
           });
           return NextResponse.json({ url: portalSession.url });
        }
      } catch (err) {
        console.error("Error checking existing subscription:", err);
        // If error (e.g. sub not found), proceed to create new one as fallback
      }
    }

    let customerId = dbSubscription?.stripeCustomerId;

    // If no customer ID in DB, check if user exists in Stripe by email or create new
    if (!customerId) {
      const existingCustomers = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name || undefined,
          metadata: {
            userId: session.user.id,
          },
        });
        customerId = customer.id;
      }
      
      // Save customer ID to DB
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
            userId: session.user.id,
            stripeCustomerId: customerId,
            plan: "FREE",
        },
        update: {
            stripeCustomerId: customerId,
        }
      });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing?canceled=true`,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
