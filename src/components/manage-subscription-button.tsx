"use client"

import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import Link from "next/link"

export function ManageSubscriptionButton() {
  return (
    <Button variant="outline" asChild>
      <Link href="/billing">
        <Settings2 className="mr-2 h-4 w-4" />
        Manage Subscription
      </Link>
    </Button>
  )
}
