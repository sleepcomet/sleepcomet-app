import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // This Stripe billing portal route is deprecated
    // The app uses Mercado Pago for payment processing
    // Redirect to the billing page where users can manage their subscription
    return NextResponse.json({ 
      error: "Stripe billing portal is no longer supported. Please manage your subscription from the billing page.",
      url: `${process.env.NEXT_PUBLIC_CONSOLE_URL}/billing` 
    }, { status: 400 });
  } catch (error) {
    console.error("[STRIPE_PORTAL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
