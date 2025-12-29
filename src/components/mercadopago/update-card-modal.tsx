"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface UpdateCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionId: string
  onSuccess?: () => void
}

declare global {
  interface Window {
    MercadoPago: any
  }
}

export function UpdateCardModal({ 
  open, 
  onOpenChange, 
  subscriptionId,
  onSuccess 
}: UpdateCardModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const brickInitialized = useRef(false)
  const brickController = useRef<any>(null)

  useEffect(() => {
    if (!open || brickInitialized.current) return

    const initBrick = async () => {
      try {
        // Wait for MercadoPago SDK
        if (!window.MercadoPago) {
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

        const settings = {
          initialization: {
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
                  errorColor: "hsl(var(--destructive))",
                  outlinePrimaryColor: "hsl(var(--primary))",
                  outlineSecondaryColor: "hsl(var(--border))",
                  formInputsTextColor: "hsl(var(--foreground))",
                  formInputsBorderColor: "hsl(var(--border))",
                  formInputsBackgroundColor: "hsl(var(--input))",
                  formInputsBorderRadius: "8px",
                },
              },
              hideFormTitle: true,
              hidePaymentButton: false,
              texts: {
                formSubmit: "Atualizar cartão",
              },
            },
          },
          callbacks: {
            onReady: () => {
              setIsLoading(false)
              brickInitialized.current = true
            },
            onSubmit: async (formData: any) => {
              try {
                const response = await fetch(`/api/mercadopago/subscription/${subscriptionId}/update-card`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(formData),
                })

                const data = await response.json()

                if (!response.ok) {
                  throw new Error(data.error || "Failed to update card")
                }

                setSuccess(true)
                toast.success("Cartão atualizado com sucesso!")
                onSuccess?.()
                
                setTimeout(() => {
                  onOpenChange(false)
                  setSuccess(false)
                }, 2000)
              } catch (error: any) {
                toast.error(error.message || "Erro ao atualizar cartão")
              }
            },
            onError: (error: any) => {
              console.error("Brick error:", error)
              setError(error.message || "An error occurred")
            },
          },
        }

        brickController.current = await bricksBuilder.create(
          "cardPayment",
          "updateCardBrick_container",
          settings
        )
      } catch (error: any) {
        console.error("Failed to initialize brick:", error)
        setError(error.message || "Failed to initialize form")
        setIsLoading(false)
      }
    }

    // Small delay to ensure container is mounted
    const timer = setTimeout(initBrick, 100)

    return () => {
      clearTimeout(timer)
      if (brickController.current) {
        brickController.current.unmount()
        brickInitialized.current = false
      }
    }
  }, [open, subscriptionId, onSuccess, onOpenChange])

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setError(null)
      setSuccess(false)
      setIsLoading(true)
      if (brickController.current) {
        brickController.current.unmount()
        brickController.current = null
        brickInitialized.current = false
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Atualizar cartão
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do novo cartão. Ele será usado para as próximas cobranças.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[300px]">
          {success ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <p className="font-medium">Cartão atualizado!</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive text-center mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                </div>
              )}
              <div
                id="updateCardBrick_container"
                ref={containerRef}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
