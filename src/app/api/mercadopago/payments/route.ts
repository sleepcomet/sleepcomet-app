import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"

// Map MP payment status to our normalized status
function mapPaymentStatus(status: string): "approved" | "pending" | "rejected" | "refunded" {
  switch (status) {
    case "approved":
      return "approved"
    case "pending":
    case "in_process":
    case "in_mediation":
      return "pending"
    case "rejected":
    case "cancelled":
      return "rejected"
    case "refunded":
    case "charged_back":
      return "refunded"
    default:
      return "pending"
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const subscriptionId = url.searchParams.get("subscriptionId")

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription || !subscription.mpPreapprovalId) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Use the subscription ID from query or from user's subscription
    const targetSubId = subscriptionId || subscription.mpPreapprovalId

    try {
      const mp = getMercadoPagoClient()
      
      // Get payments associated with the preapproval
      // MP doesn't have a direct endpoint for this, so we search by external_reference
      const paymentsResponse = await mp.getPaymentsByPreapproval(targetSubId)

      const payments = paymentsResponse.results.map((payment) => ({
        id: String(payment.id),
        date: payment.date_created,
        amount: payment.transaction_amount,
        status: mapPaymentStatus(payment.status),
        description: payment.description || `Pagamento ${subscription.plan}`,
        paymentMethod: payment.payment_method_id,
        cardLast4: payment.card?.last_four_digits,
        receiptUrl: undefined, // MP doesn't provide receipt URLs directly
      }))

      return NextResponse.json({
        success: true,
        data: payments,
      })
    } catch (err) {
      console.error("Error fetching payments from MP:", err)
      // Return empty if can't fetch from MP
      return NextResponse.json({
        success: true,
        data: [],
      })
    }
  } catch (error) {
    console.error("[MP_GET_PAYMENTS]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
