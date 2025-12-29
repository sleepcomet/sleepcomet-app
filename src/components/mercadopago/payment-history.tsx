"use client"

import { useState } from "react"
import { 
  CreditCard, 
  History, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ExternalLink,
  Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { usePaymentHistory } from "@/hooks/use-subscription"

interface PaymentHistoryProps {
  subscriptionId?: string
  className?: string
}

const statusConfig = {
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-500",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-500",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-500",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "bg-blue-500/10 text-blue-500",
    icon: History,
  },
}

export function PaymentHistory({ subscriptionId, className }: PaymentHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: payments = [], isLoading, error } = usePaymentHistory(subscriptionId)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-4 text-destructive", className)}>
        <AlertCircle className="h-5 w-5" />
        <span>Failed to load payment history</span>
      </div>
    )
  }

  return (
    <div className={cn("rounded-2xl border bg-card", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-6 h-auto hover:bg-muted/50 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Payment History</h3>
                <p className="text-sm text-muted-foreground">
                  {payments.length} payment{payments.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <ChevronRight className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payments found</p>
              </div>
            ) : (
              payments.map((payment) => {
                const status = statusConfig[payment.status]
                const StatusIcon = status.icon
                
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        status.color.split(" ")[0]
                      )}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(payment.date)}</span>
                          {payment.cardLast4 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                •••• {payment.cardLast4}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(payment.amount)}</p>
                        <Badge variant="secondary" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                      {payment.receiptUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
