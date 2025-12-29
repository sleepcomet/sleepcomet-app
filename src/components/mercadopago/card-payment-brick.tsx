"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CardPaymentBrickProps {
  amount: number
  planId: string
  planName: string
  interval: "monthly" | "yearly"
  onSuccess: (paymentData: PaymentData) => void
  onError: (error: string) => void
  className?: string
}

interface PaymentData {
  paymentId: string
  status: string
  statusDetail: string
  paymentMethodId: string
  transactionAmount: number
}

declare global {
  interface Window {
    MercadoPago: any
    cardPaymentBrickController: any
  }
}

export function CardPaymentBrick({
  amount,
  planId,
  planName,
  interval,
  onSuccess,
  onError,
  className,
}: CardPaymentBrickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [brickError, setBrickError] = useState<string | null>(null)
  const brickInitialized = useRef(false)

  useEffect(() => {
    if (brickInitialized.current) return
    
    const initBrick = async () => {
      try {
        // Wait for MercadoPago SDK
        if (!window.MercadoPago) {
          // Load SDK dynamically
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://sdk.mercadopago.com/js/v2"
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Failed to load SDK"))
            document.body.appendChild(script)
          })
        }

        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
        if (!publicKey) {
          throw new Error("Mercado Pago public key not configured")
        }

        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        })

        const bricksBuilder = mp.bricks()

        // Destroy existing brick if any
        if (window.cardPaymentBrickController) {
          window.cardPaymentBrickController.unmount()
        }

        const settings = {
          initialization: {
            amount: amount,
            payer: {
              email: "",
            },
          },
          customization: {
            visual: {
              style: {
                theme: "dark",
                customVariables: {
                  formBackgroundColor: "transparent",
                  baseColor: "hsl(var(--primary))",
                  baseColorFirstVariant: "hsl(var(--primary))",
                  baseColorSecondVariant: "hsl(var(--primary))",
                  errorColor: "hsl(var(--destructive))",
                  successColor: "hsl(142.1 76.2% 36.3%)",
                  outlinePrimaryColor: "hsl(var(--primary))",
                  outlineSecondaryColor: "hsl(var(--border))",
                  buttonTextColor: "hsl(var(--primary-foreground))",
                  formInputsTextColor: "hsl(var(--foreground))",
                  formInputsBorderColor: "hsl(var(--border))",
                  formInputsBackgroundColor: "hsl(var(--input))",
                  formInputsBorderWidth: "1px",
                  formInputsBorderRadius: "8px",
                  formInputsErrorColor: "hsl(var(--destructive))",
                  inputVerticalPadding: "12px",
                  inputHorizontalPadding: "14px",
                  inputFocusedBoxShadow: "0 0 0 2px hsl(var(--ring))",
                  inputErrorFocusedBoxShadow: "0 0 0 2px hsl(var(--destructive))",
                  inputFocusedBorderWidth: "2px",
                },
              },
              hideFormTitle: true,
              hidePaymentButton: false,
              texts: {
                formSubmit: "Assinar agora",
              },
            },
            paymentMethods: {
              maxInstallments: 1,
            },
          },
          callbacks: {
            onReady: () => {
              setIsLoading(false)
              brickInitialized.current = true
            },
            onSubmit: async (formData: any) => {
              try {
                const response = await fetch("/api/mercadopago/subscription", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    ...formData,
                    planId,
                    planName,
                    interval,
                    amount,
                  }),
                })

                const data = await response.json()

                if (!response.ok) {
                  throw new Error(data.error || "Payment failed")
                }

                onSuccess({
                  paymentId: data.id,
                  status: data.status,
                  statusDetail: data.status_detail,
                  paymentMethodId: data.payment_method_id,
                  transactionAmount: data.transaction_amount,
                })
              } catch (error: any) {
                onError(error.message || "Payment processing failed")
              }
            },
            onError: (error: any) => {
              console.error("Brick error:", error)
              setBrickError(error.message || "An error occurred")
              onError(error.message || "An error occurred")
            },
          },
        }

        window.cardPaymentBrickController = await bricksBuilder.create(
          "cardPayment",
          "cardPaymentBrick_container",
          settings
        )
      } catch (error: any) {
        console.error("Failed to initialize brick:", error)
        setBrickError(error.message || "Failed to initialize payment form")
        setIsLoading(false)
      }
    }

    initBrick()

    return () => {
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount()
        brickInitialized.current = false
      }
    }
  }, [amount, planId, planName, interval, onSuccess, onError])

  if (brickError) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 rounded-xl border border-destructive/30 bg-destructive/5", className)}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive text-center font-medium">{brickError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-xl">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full">
              <CreditCard className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando formulário de pagamento...</p>
          </div>
        </div>
      )}
      <div
        id="cardPaymentBrick_container"
        ref={containerRef}
        className="min-h-[400px]"
      />
    </div>
  )
}
