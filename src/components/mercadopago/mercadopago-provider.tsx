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

type MercadoPagoInstance = {
  bricks: () => {
    create: (brick: string, containerId: string, settings: Record<string, unknown>) => Promise<{ unmount: () => void }>
  }
}

type MercadoPagoConstructor = new (publicKey: string, options: { locale: string }) => MercadoPagoInstance

declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor
    cardPaymentBrickController: unknown
  }
}

export function MercadoPagoProvider({ children, publicKey }: MercadoPagoProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if script is already loaded
    if (window.MercadoPago) {
      requestAnimationFrame(() => setIsLoaded(true))
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true

    script.onload = () => {
      if (window.MercadoPago) {
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
