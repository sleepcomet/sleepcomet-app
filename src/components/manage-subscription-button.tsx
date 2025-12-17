"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleManage = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      })
      
      if (!res.ok) {
        throw new Error("Failed to create portal session")
      }

      const { url } = await res.json()
      router.push(url)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleManage} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Manage Subscription
    </Button>
  )
}
