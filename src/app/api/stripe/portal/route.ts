import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbSubscription = await prisma.subscription.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!dbSubscription?.stripeCustomerId) {
      return new NextResponse("No subscription found", { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbSubscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[STRIPE_PORTAL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
