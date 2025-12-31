import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { PLANS } from "@/config/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes max

/**
 * Cron Job: Renova assinaturas automaticamente
 * 
 * Roda diariamente via Vercel Cron
 * Verifica assinaturas que precisam ser renovadas
 * Processa pagamento com cartão salvo
 * Atualiza período da assinatura
 */
export async function GET(req: Request) {
  try {
    // Verificar autorização (Vercel Cron envia um header especial)
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Em produção, verificar secret do Vercel Cron
    if (process.env.NODE_ENV === "production") {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    console.log("[CRON] Starting subscription renewal check...")

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Buscar assinaturas que precisam ser renovadas
    const subscriptionsToRenew = await prisma.subscription.findMany({
      where: {
        status: "active",
        autoRenew: true,
        cancelAtPeriodEnd: false,
        nextBillingDate: {
          lte: tomorrow, // Renova 1 dia antes
        },
        plan: {
          not: "FREE",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`[CRON] Found ${subscriptionsToRenew.length} subscriptions to renew`)

    const results = {
      total: subscriptionsToRenew.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    }

    const mp = getMercadoPagoClient()

    for (const subscription of subscriptionsToRenew) {
      try {
        console.log(`[CRON] Processing renewal for user ${subscription.userId}`)

        // Verificar se tem cartão salvo
        if (!subscription.mpCustomerId || !subscription.mpPaymentMethodId) {
          throw new Error("No payment method saved")
        }

        // Calcular valor baseado no plano e intervalo
        const plan = PLANS[subscription.plan as keyof typeof PLANS]
        if (!plan) {
          throw new Error("Invalid plan")
        }

        const amount = subscription.interval === "yearly" 
          ? plan.prices.yearly 
          : plan.prices.monthly

        // Criar pagamento com cartão salvo
        // Criar pagamento com cartão salvo
        const paymentData = {
          transaction_amount: amount,
          description: `${plan.name} - Renovação ${subscription.interval === "yearly" ? "Anual" : "Mensal"}`,
          payment_method_id: subscription.mpCardBrand || "visa",
          token: subscription.mpPaymentMethodId, // Usar token do cartão salvo
          payer: {
            email: subscription.user.email,
          },
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payment = await mp.createPayment(paymentData as any)

        // Calcular novo período
        const newPeriodEnd = new Date(subscription.currentPeriodEnd || now)
        if (subscription.interval === "yearly") {
          newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1)
        } else {
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)
        }

        // Atualizar assinatura
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: payment.status === "approved" ? "active" : "past_due",
            currentPeriodEnd: payment.status === "approved" ? newPeriodEnd : subscription.currentPeriodEnd,
            nextBillingDate: payment.status === "approved" ? newPeriodEnd : subscription.nextBillingDate,
            lastPaymentDate: payment.status === "approved" ? now : subscription.lastPaymentDate,
            lastPaymentAmount: payment.status === "approved" ? amount : subscription.lastPaymentAmount,
          },
        })

        // Registrar pagamento
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: amount,
            currency: "BRL",
            status: payment.status,
            interval: subscription.interval,
            mpPaymentId: String(payment.id),
            mpStatus: payment.status,
            mpStatusDetail: payment.status_detail,
            description: `${plan.name} - Renovação Automática`,
            paidAt: payment.status === "approved" ? now : null,
            failureReason: payment.status !== "approved" ? payment.status_detail : null,
          },
        })

        if (payment.status === "approved") {
          results.successful++
          console.log(`[CRON] ✅ Renewed subscription for user ${subscription.userId}`)
        } else {
          results.failed++
          results.errors.push({
            userId: subscription.userId,
            error: `Payment ${payment.status}: ${payment.status_detail}`,
          })
          console.log(`[CRON] ❌ Failed to renew for user ${subscription.userId}: ${payment.status_detail}`)
        }

      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results.errors.push({
          userId: subscription.userId,
          error: errorMessage,
        })
        console.error(`[CRON] ❌ Error renewing subscription for user ${subscription.userId}:`, error)

        // Marcar assinatura como past_due se falhar
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "past_due",
          },
        }).catch(err => console.error("Error updating subscription status:", err))
      }
    }

    console.log(`[CRON] Renewal complete: ${results.successful} successful, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })

  } catch (error) {
    console.error("[CRON] Fatal error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
