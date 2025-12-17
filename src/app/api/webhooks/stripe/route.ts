import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlanByPriceId } from "@/config/plans";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret || !signature) {
      return new Response("Missing secret or signature", { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook Error: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription?.id;
      
    const userId = session.metadata?.userId;

    if (userId && subscriptionId) {
       try {
         const sub = await stripe.subscriptions.retrieve(subscriptionId);
         const priceId = sub.items.data[0].price.id;
         const plan = getPlanByPriceId(priceId);

         if (!plan) {
           console.error("[STRIPE_WEBHOOK] PLAN NOT FOUND for priceId:", priceId);
         }

         await prisma.subscription.upsert({
           where: { userId },
           create: {
             userId,
             stripeCustomerId: session.customer as string,
             stripeSubscriptionId: subscriptionId,
             stripePriceId: priceId,
             stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
             plan: plan || "FREE",
           },
           update: {
             stripeCustomerId: session.customer as string,
             stripeSubscriptionId: subscriptionId,
             stripePriceId: priceId,
             stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
             plan: plan || "FREE",
           }
         });
       } catch (error) {
         console.error("[STRIPE_WEBHOOK] Error processing checkout session:", error);
         return new Response("Internal Server Error", { status: 500 });
       }
    } else {
      console.error("[STRIPE_WEBHOOK] Missing userId or subscriptionId in metadata/session");
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const invoiceData = invoice as unknown as { subscription: string | { id: string } | null };
    const subscriptionId = typeof invoiceData.subscription === 'string' 
      ? invoiceData.subscription 
      : invoiceData.subscription?.id;

    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0].price.id;
        const plan = getPlanByPriceId(priceId);

        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (dbSub) {
          await prisma.subscription.update({
            where: { id: dbSub.id },
            data: {
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
              plan: plan || "FREE",
            }
          });
        }
      } catch (error) {
        console.error("[STRIPE_WEBHOOK] Error processing invoice payment:", error);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    try {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0].price.id;
      const plan = getPlanByPriceId(priceId);

      const dbSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id }
      });

      if (dbSub) {
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
            plan: plan || "FREE",
          }
        });
      }
    } catch (error) {
      console.error("[STRIPE_WEBHOOK] Error processing subscription update:", error);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    try {
      const sub = event.data.object as Stripe.Subscription;
      
      const dbSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id }
      });

      if (dbSub) {
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            plan: "FREE",
            stripeCurrentPeriodEnd: null,
            stripePriceId: null,
          }
        });
      }
    } catch (error) {
      console.error("[STRIPE_WEBHOOK] Error processing subscription deletion:", error);
    }
  }

  return NextResponse.json({ received: true });
}
