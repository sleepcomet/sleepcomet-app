import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

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

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Fetch payments from local database
    const localPayments = await prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { paidAt: 'desc' },
      take: 20
    });

    const payments = localPayments.map((payment) => ({
      id: payment.mpPaymentId || payment.id,
      date: payment.paidAt || new Date(),
      amount: payment.amount,
      status: mapPaymentStatus(payment.status || payment.mpStatus || 'pending'),
      description: payment.description,
      paymentMethod: 'credit_card', // defaulting as we store generic
      cardLast4: '****', // We might not store card last 4 in Payment model yet, checking schema...
      receiptUrl: undefined,
    }))

    return NextResponse.json({
      success: true,
      data: payments,
    })
  } catch (error) {
    console.error("[MP_GET_PAYMENTS]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
