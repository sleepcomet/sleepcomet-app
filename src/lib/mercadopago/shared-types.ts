// Shared types for Mercado Pago integration
// These types are used until Prisma Client is regenerated with new schema

export type SubscriptionWithMP = {
  id: string
  userId: string
  plan: string
  mpCustomerId?: string | null
  mpPreapprovalId?: string | null
  mpPaymentMethodId?: string | null
  mpCardLastFour?: string | null
  mpCardBrand?: string | null
  mpCurrentPeriodEnd?: Date | null
  mpStatus?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  stripeCurrentPeriodEnd?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Helper to cast raw subscription to include MP fields
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSubscriptionWithMP(raw: any): SubscriptionWithMP | null {
  return raw as SubscriptionWithMP | null
}
