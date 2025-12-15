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
import Link from "next/link"

interface UpgradeToSoloModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeToSoloModal({
  open,
  onOpenChange,
}: UpgradeToSoloModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        {/* Header Section with Gradient */}
        <div className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 backdrop-blur-md">
                RECOMMENDED
              </Badge>
              <DialogTitle className="text-3xl font-bold">Upgrade to Solo</DialogTitle>
              <DialogDescription className="text-indigo-100 text-base max-w-[90%]">
                Supercharge your monitoring with advanced features designed for professionals and growing projects.
              </DialogDescription>
            </div>
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 bg-background">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Pricing Column */}
            <div className="flex-none w-full md:w-48 space-y-4">
              <div>
                <p className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Pricing</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-foreground">$9</span>
                  <span className="text-muted-foreground ml-1">/ month</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple, transparent pricing. Cancel at any time.
              </p>
            </div>

            {/* Features Column */}
            <div className="flex-1 space-y-6">
              <p className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Everything in Solo</p>
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Unlimited Endpoints</p>
                    <p className="text-sm text-muted-foreground">Monitor as many services as you need without limits.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">1-minute Check Intervals</p>
                    <p className="text-sm text-muted-foreground">Get faster alerts with high-frequency monitoring.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Shield className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">30-day Data Retention</p>
                    <p className="text-sm text-muted-foreground">Analyze historical performance trends over the last month.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <DialogFooter className="bg-muted/50 p-6 flex-row items-center justify-between sm:justify-between border-t gap-4">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/billing">
              View all plans
            </Link>
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
            <Button type="submit" className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade to Solo
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
