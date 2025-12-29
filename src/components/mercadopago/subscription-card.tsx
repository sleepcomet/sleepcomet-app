"use client"

import { useState } from "react"
import { 
  CreditCard, 
  Calendar, 
  Check, 
  X, 
  AlertTriangle,
  Loader2,
  PauseCircle,
  PlayCircle,
  Ban,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface SubscriptionCardProps {
  subscription: {
    id: string
    planName: string
    status: "active" | "paused" | "cancelled" | "pending" | "expired"
    amount: number
    interval: "monthly" | "yearly"
    nextBillingDate?: string
    cardLast4?: string
    cardBrand?: string
    startDate: string
    endDate?: string
  }
  onUpdate?: () => void
  className?: string
}

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: Check,
  },
  paused: {
    label: "Paused",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: PauseCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: X,
  },
  pending: {
    label: "Pending",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: RefreshCw,
  },
  expired: {
    label: "Expired",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: AlertTriangle,
  },
}

export function SubscriptionCard({ subscription, onUpdate, className }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  const status = statusConfig[subscription.status]
  const StatusIcon = status.icon

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleAction = async (action: "pause" | "resume" | "cancel") => {
    setIsLoading(action)
    try {
      const response = await fetch(`/api/mercadopago/subscription/${subscription.id}/${action}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Action failed")
      }

      toast.success(
        action === "pause" 
          ? "Subscription paused successfully"
          : action === "resume"
          ? "Subscription resumed successfully"
          : "Subscription cancelled successfully"
      )
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to process action. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/50 backdrop-blur-sm",
      "p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {subscription.planName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {subscription.interval === "monthly" ? "Monthly" : "Yearly"} subscription
          </p>
        </div>
        <Badge variant="outline" className={cn("font-medium", status.color)}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Price */}
      <div className="relative mt-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">
            {formatCurrency(subscription.amount)}
          </span>
          <span className="text-muted-foreground text-sm">
            /{subscription.interval === "monthly" ? "mo" : "year"}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="relative mt-6 space-y-3">
        {subscription.cardLast4 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-background">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {subscription.cardBrand?.toUpperCase() || "Card"} •••• {subscription.cardLast4}
              </p>
              <p className="text-xs text-muted-foreground">Payment method</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-lg bg-background">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {subscription.status === "active" 
                ? subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : "—"
                : subscription.endDate 
                  ? formatDate(subscription.endDate)
                  : "—"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {subscription.status === "active" 
                ? "Next billing date"
                : "End date"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative mt-6 flex flex-wrap gap-3">
        {subscription.status === "active" && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!!isLoading}
              onClick={() => handleAction("pause")}
              className="flex-1 min-w-[120px]"
            >
              {isLoading === "pause" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PauseCircle className="h-4 w-4 mr-2" />
              )}
              Pause
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[120px] text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={!!isLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will cancel your subscription. You will continue to have access until the end of your current billing period.
                    This action cannot be automatically undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Go back</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction("cancel")}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoading === "cancel" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Confirm cancellation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {subscription.status === "paused" && (
          <Button
            size="sm"
            disabled={!!isLoading}
            onClick={() => handleAction("resume")}
            className="flex-1 bg-gradient-to-r from-primary to-primary/90"
          >
            {isLoading === "resume" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Resume subscription
          </Button>
        )}

        {(subscription.status === "cancelled" || subscription.status === "expired") && (
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-primary to-primary/90"
            asChild
          >
            <a href="/checkout">
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew subscription
            </a>
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative mt-6 pt-6 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Subscriber since {formatDate(subscription.startDate)}</span>
        </div>
      </div>
    </div>
  )
}
