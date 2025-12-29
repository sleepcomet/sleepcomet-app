"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface MercadoPagoContextType {
  isLoaded: boolean
  error: string | null
}

const MercadoPagoContext = createContext<MercadoPagoContextType>({
  isLoaded: false,
  error: null,
})

export function useMercadoPago() {
  return useContext(MercadoPagoContext)
}

interface MercadoPagoProviderProps {
  children: ReactNode
  publicKey: string
}

declare global {
  interface Window {
    MercadoPago: any
    cardPaymentBrickController: any
  }
}

export function MercadoPagoProvider({ children, publicKey }: MercadoPagoProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if script is already loaded
    if (window.MercadoPago) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true

    script.onload = () => {
      if (window.MercadoPago) {
        window.MercadoPago = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        })
        setIsLoaded(true)
      }
    }

    script.onerror = () => {
      setError("Failed to load Mercado Pago SDK")
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [publicKey])

  return (
    <MercadoPagoContext.Provider value={{ isLoaded, error }}>
      {children}
    </MercadoPagoContext.Provider>
  )
}
