import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { PlanType } from "@/config/plans"

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
      case "subscription_preapproval": {
        // Subscription status changed
        const preapprovalId = body.data.id
        
        try {
          const preapproval = await mp.getPreapproval(preapprovalId)
          
          // Find subscription by preapproval ID
          const subscription = await prisma.subscription.findFirst({
            where: { mpPreapprovalId: preapprovalId },
          })

          if (subscription) {
            const updateData: {
              mpStatus: string
              plan?: string
            } = {
              mpStatus: preapproval.status,
            }

            // If cancelled and period ended, downgrade to free
            if (
              preapproval.status === "cancelled" &&
              subscription.mpCurrentPeriodEnd &&
              new Date(subscription.mpCurrentPeriodEnd) < new Date()
            ) {
              updateData.plan = "FREE"
            }

            await prisma.subscription.update({
              where: { id: subscription.id },
              data: updateData,
            })

            console.log(
              `[MP_WEBHOOK] Updated subscription ${subscription.id} status to ${preapproval.status}`
            )
          } else {
            console.log(
              `[MP_WEBHOOK] Subscription not found for preapproval ${preapprovalId}`
            )
          }
        } catch (err) {
          console.error("[MP_WEBHOOK] Error processing preapproval:", err)
        }
        break
      }

      case "subscription_authorized_payment": {
        // A payment was made for the subscription
        const paymentId = body.data.id
        
        try {
          const payment = await mp.getPayment(paymentId)
          
          if (payment.status === "approved") {
            // Find subscription by payer email or external_reference
            const subscription = await prisma.subscription.findFirst({
              where: {
                user: {
                  email: payment.payer.email,
                },
              },
            })

            if (subscription) {
              // Update the period end date
              const nextPeriodEnd = new Date()
              // Check if yearly or monthly based on amount or stored data
              if (subscription.mpCurrentPeriodEnd) {
                const currentEnd = new Date(subscription.mpCurrentPeriodEnd)
                // If renewal, extend from current end
                if (currentEnd > new Date()) {
                  nextPeriodEnd.setTime(currentEnd.getTime())
                }
              }
              nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1)

              await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                  mpCurrentPeriodEnd: nextPeriodEnd,
                  mpStatus: "authorized",
                },
              })

              console.log(
                `[MP_WEBHOOK] Payment approved for subscription ${subscription.id}`
              )
            }
          }
        } catch (err) {
          console.error("[MP_WEBHOOK] Error processing payment:", err)
        }
        break
      }

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
