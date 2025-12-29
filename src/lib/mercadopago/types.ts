// Mercado Pago API types for subscriptions and payments

export interface MercadoPagoCardToken {
  id: string
  public_key: string
  cardholder: {
    identification: {
      number: string
      type: string
    }
    name: string
  }
  status: string
  date_created: string
  date_last_updated: string
  date_due: string
  luhn_validation: boolean
  live_mode: boolean
  require_esc: boolean
  security_code_length: number
  expiration_month: number
  expiration_year: number
  last_four_digits: string
  first_six_digits: string
}

export interface MercadoPagoPaymentData {
  token: string
  issuer_id?: string
  payment_method_id: string
  transaction_amount: number
  installments: number
  payer: {
    email: string
    identification?: {
      type: string
      number: string
    }
  }
}

export interface MercadoPagoSubscription {
  id: string
  payer_id: number
  payer_email: string
  back_url: string
  collector_id: number
  application_id: number | null
  status: "pending" | "authorized" | "paused" | "cancelled"
  reason: string
  external_reference: string
  date_created: string
  last_modified: string
  init_point: string
  auto_recurring: {
    frequency: number
    frequency_type: "months" | "days"
    transaction_amount: number
    currency_id: "BRL" | "ARS" | "MXN" | "CLP" | "COP" | "PEN" | "UYU"
    start_date: string
    end_date?: string
  }
  summarized: {
    quotas: number | null
    charged_quantity: number
    pending_charge_quantity: number | null
    charged_amount: number
    pending_charge_amount: number | null
    semaphore: string
    last_charged_date: string | null
    last_charged_amount: number | null
  }
  next_payment_date: string
  payment_method_id: string
  card_id?: number
  first_invoice_offset?: number
}

export interface MercadoPagoPayment {
  id: number
  date_created: string
  date_approved: string | null
  date_last_updated: string
  money_release_date: string | null
  status: "pending" | "approved" | "authorized" | "in_process" | "in_mediation" | "rejected" | "cancelled" | "refunded" | "charged_back"
  status_detail: string
  transaction_amount: number
  transaction_amount_refunded: number
  currency_id: string
  description: string
  collector_id: number
  payer: {
    id: number
    email: string
    type: "customer" | "registered"
  }
  payment_method_id: string
  payment_type_id: string
  card?: {
    id: string
    first_six_digits: string
    last_four_digits: string
    expiration_month: number
    expiration_year: number
    cardholder: {
      name: string
    }
  }
  installments: number
  external_reference?: string
}

export interface CreateSubscriptionPayload {
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
}

export interface SubscriptionAction {
  subscriptionId: string
  action: "pause" | "resume" | "cancel"
}

export interface UpdateCardPayload {
  subscriptionId: string
  token: string
  payer: {
    email: string
  }
}

// Frontend subscription type (normalized)
export interface Subscription {
  id: string
  planName: string
  status: "active" | "paused" | "cancelled" | "pending" | "expired"
  amount: number
  interval: "monthly" | "yearly"
  nextBillingDate: string
  cardLast4?: string
  cardBrand?: string
  startDate: string
  endDate?: string
}

// Frontend payment type (normalized)
export interface Payment {
  id: string
  date: string
  amount: number
  status: "approved" | "pending" | "rejected" | "refunded"
  description: string
  paymentMethod: string
  cardLast4?: string
  receiptUrl?: string
}

// API Response types
export interface ApiSuccessResponse<T> {
  data: T
  success: true
}

export interface ApiErrorResponse {
  error: string
  success: false
  code?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Plan configuration type
export interface PlanConfig {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  mercadoPagoPreapprovalPlanId?: {
    monthly?: string
    yearly?: string
  }
  features: {
    endpoints: number
    statusPages: number
    checkInterval: number
    retention: number
    customDomain: boolean
    emailAlerts: boolean
    responseAlerts: boolean
    sslMonitoring: boolean
  }
}
