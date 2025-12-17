"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function CheckoutHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasProcessed = useRef(false)

  useEffect(() => {
    const processCheckout = async () => {
      const plan = searchParams.get("plan")
      const interval = searchParams.get("interval")

      if (!plan || hasProcessed.current) return

      if (plan === "free") {
         router.replace("/")
         return
      }

      hasProcessed.current = true
      
      const toastId = toast.loading("Starting checkout...")

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan, interval }),
        })

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || "Failed to create checkout session")
        }

        const { url } = await res.json()
        if (url) {
            router.push(url)
        } else {
            toast.success("Plan updated successfully!", { id: toastId })
            router.push("/billing") 
        }

      } catch (error) {
        console.error(error)
        toast.error("Failed to start checkout. Please try again from billing page.", { id: toastId })
        // Remove params to avoid loop/retry
        router.replace("/")
      }
    }

    processCheckout()
  }, [searchParams, router])

  return null
}
