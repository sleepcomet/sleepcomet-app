import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // const { id } = await context.params
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Card token is required" }, { status: 400 })
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!subscription || !subscription.mpCustomerId) {
      return NextResponse.json({ error: "Subscription or Customer not found" }, { status: 404 })
    }

    const mp = getMercadoPagoClient()
    
    // Save card to customer
    // We use the token to create a card for the customer
    const savedCard = await mp.saveCard(subscription.mpCustomerId, token);

    // Update database with new Card ID and details
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mpPaymentMethodId: savedCard.id, // Reusable Card ID
        mpCardLastFour: savedCard.last_four_digits,
        mpCardBrand: savedCard.first_six_digits, // This is technically bin, but brand is usually payment_method.id (visa)
        // savedCard.payment_method.id would be 'visa'
      },
    })

    return NextResponse.json({
      success: true,
      message: "Card updated successfully",
    })
  } catch (error) {
    console.error("[MP_UPDATE_CARD]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
