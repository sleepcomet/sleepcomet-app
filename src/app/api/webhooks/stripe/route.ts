import { NextResponse } from "next/server";

// This Stripe webhook route is deprecated
// The app uses Mercado Pago for payment processing
// Stripe webhooks are no longer supported

export async function POST() {
  console.warn("[STRIPE_WEBHOOK] Received webhook but Stripe is deprecated. Use Mercado Pago webhooks instead.");
  
  return NextResponse.json({ 
    received: true,
    deprecated: true,
    message: "Stripe webhooks are no longer supported. Please use Mercado Pago webhooks."
  });
}
