"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function CheckoutHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasProcessed = useRef(false)

  useEffect(() => {
    const processCheckout = async () => {
      const plan = searchParams.get("plan")
      const interval = searchParams.get("interval") || "monthly"

      if (!plan || hasProcessed.current) return

      hasProcessed.current = true

      // Free plan - just redirect to home
      if (plan === "free") {
        router.replace("/")
        return
      }

      // Paid plans - redirect to checkout page with plan pre-selected
      router.replace(`/checkout?plan=${plan}&interval=${interval}`)
    }

    processCheckout()
  }, [searchParams, router])

  return null
}
