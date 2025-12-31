import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"



export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Update database to stop auto-renewal
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelAtPeriodEnd: true,
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
