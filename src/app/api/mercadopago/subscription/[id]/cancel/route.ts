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

    // Cancel the subscription
    await mp.updatePreapproval(id, {
      status: "cancelled",
    })

    // Update database - keep the plan until period ends
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mpStatus: "cancelled",
        // Don't change plan to FREE yet - they have access until period ends
      },
    })

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    })
  } catch (error) {
    console.error("[MP_CANCEL_SUBSCRIPTION]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
