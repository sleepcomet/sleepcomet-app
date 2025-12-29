import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Card token is required" }, { status: 400 })
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        mpPreapprovalId: id,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    const mp = getMercadoPagoClient()

    // Update the subscription with new card
    await mp.updatePreapproval(id, {
      card_token_id: token,
    })

    // Get card info from token
    let cardLastFour = ""
    let cardBrand = ""
    try {
      const cardInfo = await mp.getCardToken(token)
      cardLastFour = cardInfo.last_four_digits
      cardBrand = cardInfo.first_six_digits
    } catch (err) {
      console.error("Error getting card info:", err)
    }

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mpCardLastFour: cardLastFour,
        mpCardBrand: cardBrand,
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
