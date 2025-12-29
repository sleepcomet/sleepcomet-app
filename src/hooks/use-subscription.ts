"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Subscription, Payment, ApiResponse } from "@/lib/mercadopago/types"

// Query keys
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  active: () => [...subscriptionKeys.all, "active"] as const,
  payments: (subscriptionId?: string) => 
    [...subscriptionKeys.all, "payments", subscriptionId] as const,
  paymentMethods: () => [...subscriptionKeys.all, "payment-methods"] as const,
}

// Fetch active subscription
async function fetchActiveSubscription(): Promise<Subscription | null> {
  const response = await fetch("/api/mercadopago/subscriptions/active")
  
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error("Failed to fetch subscription")
  }
  
  const data: ApiResponse<Subscription> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error)
  }
  
  return data.data
}

// Fetch payment history
async function fetchPayments(subscriptionId?: string): Promise<Payment[]> {
  const url = subscriptionId 
    ? `/api/mercadopago/payments?subscriptionId=${subscriptionId}`
    : "/api/mercadopago/payments"
    
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error("Failed to fetch payments")
  }
  
  const data: ApiResponse<Payment[]> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error)
  }
  
  return data.data
}

// Hook: Get active subscription
export function useActiveSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.active(),
    queryFn: fetchActiveSubscription,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  })
}

// Hook: Get payment history
export function usePaymentHistory(subscriptionId?: string) {
  return useQuery({
    queryKey: subscriptionKeys.payments(subscriptionId),
    queryFn: () => fetchPayments(subscriptionId),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  })
}

// Mutation: Pause subscription
export function usePauseSubscription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/mercadopago/subscription/${subscriptionId}/pause`, {
        method: "POST",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to pause subscription")
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

// Mutation: Resume subscription
export function useResumeSubscription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/mercadopago/subscription/${subscriptionId}/resume`, {
        method: "POST",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to resume subscription")
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

// Mutation: Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/mercadopago/subscription/${subscriptionId}/cancel`, {
        method: "POST",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel subscription")
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

// Mutation: Create subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (payload: {
      token: string
      planId: string
      planName: string
      interval: "monthly" | "yearly"
      amount: number
      payer: {
        email: string
        identification?: {
          type: string
          number: string
        }
      }
    }) => {
      const response = await fetch("/api/mercadopago/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create subscription")
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

// Mutation: Update payment method
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (payload: {
      subscriptionId: string
      token: string
      payer: {
        email: string
      }
    }) => {
      const response = await fetch(`/api/mercadopago/subscription/${payload.subscriptionId}/update-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: payload.token,
          payer: payload.payer,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update payment method")
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}
