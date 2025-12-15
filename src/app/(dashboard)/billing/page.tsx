"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CreditCard, Zap } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Billing</h1>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-5xl mx-auto w-full">
        {/* Current Plan */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Free Plan</CardTitle>
                <CardDescription>
                  You are currently on the Free plan.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                Current
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-background p-4 border">
                <div className="text-sm font-medium text-muted-foreground mb-1">Endpoints</div>
                <div className="text-2xl font-bold">5 / 5</div>
                <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </div>
              <div className="rounded-lg bg-background p-4 border">
                <div className="text-sm font-medium text-muted-foreground mb-1">Check Interval</div>
                <div className="text-2xl font-bold">3 min</div>
              </div>
              <div className="rounded-lg bg-background p-4 border">
                <div className="text-sm font-medium text-muted-foreground mb-1">Data Retention</div>
                <div className="text-2xl font-bold">7 Days</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-background/50 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Upgrade to higher limits and advanced features.
            </span>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                View all plans
              </Button>
              <Button className="w-full sm:w-auto">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Manage your payment details and billing address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-md">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No payment method added</p>
                  <p className="text-sm text-muted-foreground">Add a card to upgrade your plan</p>
                </div>
              </div>
              <Button variant="outline">Add Card</Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your recent invoices and transaction history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground text-sm">
              No invoices available.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
