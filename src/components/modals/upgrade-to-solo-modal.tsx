"use client"

import * as React from "react"
import { Check, Zap, Rocket, Shield, Clock } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PLANS } from "@/config/plans"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: typeof PLANS[keyof typeof PLANS]
}

export function UpgradeModal({
  open,
  onOpenChange,
  plan = PLANS.SOLO
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        <div className="bg-primary p-8 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-none mb-4 backdrop-blur-md">
                RECOMMENDED
              </Badge>
              <DialogTitle className="text-3xl font-bold">Upgrade to {plan.name.replace(" Plan", "")}</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-base max-w-[90%]">
                Supercharge your monitoring with advanced features designed for professionals and growing projects.
              </DialogDescription>
            </div>
            <div className="h-16 w-16 bg-primary-foreground/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-primary-foreground/20">
              <Rocket className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="p-8 bg-background">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-none w-full md:w-48 space-y-4">
              <div>
                <p className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Pricing</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-foreground">${plan.prices.monthly}</span>
                  <span className="text-muted-foreground ml-1">/ month</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple, transparent pricing. Cancel at any time.
              </p>
            </div>

            <div className="flex-1 space-y-6">
              <p className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Everything in {plan.name.replace(" Plan", "")}</p>
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {plan.limits.endpoints === Infinity ? "Unlimited" : plan.limits.endpoints} Endpoints
                    </p>
                    <p className="text-sm text-muted-foreground">Monitor as many services as you need without limits.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{plan.limits.checkInterval}-minute Check Intervals</p>
                    <p className="text-sm text-muted-foreground">Get faster alerts with high-frequency monitoring.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{plan.limits.retention || 30}-day Data Retention</p>
                    <p className="text-sm text-muted-foreground">Analyze historical performance trends.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/50 p-6 flex-row items-center justify-between sm:justify-between border-t gap-4">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/pricing`} target="_blank" rel="noopener noreferrer">
              View all plans
            </a>
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/pricing`} target="_blank" rel="noopener noreferrer">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade to {plan.name.replace(" Plan", "")}
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
