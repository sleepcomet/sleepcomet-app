import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
// Webhook types from Mercado Pago
interface WebhookPayload {
  id: number
  live_mode: boolean
  type: string
  date_created: string
  user_id: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

export async function POST(req: Request) {
  try {
    const body: WebhookPayload = await req.json()
    
    console.log("[MP_WEBHOOK] Received:", body.type, body.action)

    const mp = getMercadoPagoClient()

    // Handle different notification types
    switch (body.type) {
      /*
      // Native subscriptions are not currently used (we use manual recurring payments via saved cards)
      // and mpPreapprovalId field does not exist in schema.
      case "subscription_preapproval": {
        // Subscription status changed
        const preapprovalId = body.data.id
        
        try {
          const preapproval = await mp.getPreapproval(preapprovalId)
          
          // Find subscription by preapproval ID
          // const subscription = await prisma.subscription.findFirst({
          //   where: { mpPreapprovalId: preapprovalId },
          // })

          // ... (rest of logic)
        } catch (err) {
          console.error("[MP_WEBHOOK] Error processing preapproval:", err)
        }
        break
      }

      case "subscription_authorized_payment": {
         // ... (logic for native subscription payments)
         break
      }
      */

      case "payment": {
        // General payment notification
        const paymentId = body.data.id
        
        try {
          const payment = await mp.getPayment(paymentId)
          console.log(`[MP_WEBHOOK] Payment ${paymentId} status: ${payment.status}`)
          
          // Could handle payment failures here to notify user
          if (payment.status === "rejected") {
            // Find user and potentially send notification
            const subscription = await prisma.subscription.findFirst({
              where: {
                user: {
                  email: payment.payer.email,
                },
              },
              include: {
                user: true,
              },
            })

            if (subscription) {
              console.log(
                `[MP_WEBHOOK] Payment rejected for user ${subscription.user.email}`
              )
              // TODO: Send notification email about failed payment
            }
          }
        } catch (err) {
          console.error("[MP_WEBHOOK] Error processing payment notification:", err)
        }
        break
      }

      default:
        console.log(`[MP_WEBHOOK] Unhandled notification type: ${body.type}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[MP_WEBHOOK] Error:", error)
    // Still return 200 to prevent retries for malformed requests
    return NextResponse.json({ received: true })
  }
}
