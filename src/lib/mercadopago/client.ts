// Mercado Pago API Client
// SDK v2 doesn't have official Node.js types, so we use fetch directly

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com"

interface MercadoPagoConfig {
  accessToken: string
}

class MercadoPagoClient {
  private accessToken: string

  constructor(config: MercadoPagoConfig) {
    this.accessToken = config.accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${MERCADO_PAGO_API_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[MercadoPago API Error]", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      throw new Error(
        errorData.message || errorData.error || `API Error: ${response.status}`
      )
    }

    return response.json()
  }

  // ==================== PREAPPROVAL (Subscriptions) ====================

  /**
   * Create a preapproval (subscription)
   * @see https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval/post
   */
  async createPreapproval(data: {
    reason: string
    external_reference: string
    payer_email: string
    card_token_id?: string
    auto_recurring: {
      frequency: number
      frequency_type: "months" | "days"
      transaction_amount: number
      currency_id: "BRL"
      start_date?: string
      end_date?: string
    }
    back_url: string
    status?: "pending" | "authorized"
  }) {
    return this.request<{
      id: string
      payer_id: number
      payer_email: string
      back_url: string
      collector_id: number
      application_id: number | null
      status: string
      reason: string
      external_reference: string
      date_created: string
      last_modified: string
      init_point: string
      auto_recurring: {
        frequency: number
        frequency_type: string
        transaction_amount: number
        currency_id: string
        start_date: string
        end_date: string | null
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
      card_id: number | null
      first_invoice_offset: number | null
    }>("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        status: data.status || "authorized",
      }),
    })
  }

  /**
   * Get a preapproval by ID
   */
  async getPreapproval(id: string) {
    return this.request<{
      id: string
      payer_id: number
      payer_email: string
      back_url: string
      collector_id: number
      status: "pending" | "authorized" | "paused" | "cancelled"
      reason: string
      external_reference: string
      date_created: string
      last_modified: string
      auto_recurring: {
        frequency: number
        frequency_type: string
        transaction_amount: number
        currency_id: string
        start_date: string
        end_date: string | null
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
      card_id: number | null
    }>(`/preapproval/${id}`)
  }

  /**
   * Update a preapproval (change status, card, etc)
   */
  async updatePreapproval(
    id: string,
    data: {
      status?: "authorized" | "paused" | "cancelled"
      card_token_id?: string
      auto_recurring?: {
        transaction_amount?: number
      }
    }
  ) {
    return this.request(`/preapproval/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Search preapprovals by user
   */
  async searchPreapprovals(params: {
    payer_email?: string
    external_reference?: string
    status?: string
    offset?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })

    return this.request<{
      paging: {
        total: number
        limit: number
        offset: number
      }
      results: Array<{
        id: string
        payer_id: number
        payer_email: string
        status: string
        reason: string
        external_reference: string
        date_created: string
        last_modified: string
        auto_recurring: {
          frequency: number
          frequency_type: string
          transaction_amount: number
          currency_id: string
        }
        next_payment_date: string
      }>
    }>(`/preapproval/search?${searchParams.toString()}`)
  }

  // ==================== PAYMENTS ====================

  /**
   * Get payments by subscription (preapproval)
   */
  async getPaymentsByPreapproval(preapprovalId: string) {
    return this.request<{
      paging: {
        total: number
        limit: number
        offset: number
      }
      results: Array<{
        id: number
        date_created: string
        date_approved: string | null
        status: string
        status_detail: string
        transaction_amount: number
        currency_id: string
        description: string
        payment_method_id: string
        payment_type_id: string
        card?: {
          first_six_digits: string
          last_four_digits: string
          expiration_month: number
          expiration_year: number
          cardholder: {
            name: string
          }
        }
      }>
    }>(`/v1/payments/search?criteria=desc&sort=date_created&external_reference=${preapprovalId}`)
  }

  /**
   * Get payment by ID
   */
  async getPayment(id: string | number) {
    return this.request<{
      id: number
      date_created: string
      date_approved: string | null
      status: string
      status_detail: string
      transaction_amount: number
      currency_id: string
      description: string
      payment_method_id: string
      payment_type_id: string
      card?: {
        first_six_digits: string
        last_four_digits: string
        expiration_month: number
        expiration_year: number
        cardholder: {
          name: string
        }
      }
      payer: {
        id: number
        email: string
      }
    }>(`/v1/payments/${id}`)
  }

  /**
   * Create a payment
   */
  async createPayment(data: {
    transaction_amount: number
    description: string
    token: string
    installments?: number
    payer: {
      email: string
      identification?: {
        type: string
        number: string
      }
    }
  }) {
    // Generate idempotency key to prevent duplicate payments
    const idempotencyKey = crypto.randomUUID()
    
    return this.request<{
      id: number
      status: string
      status_detail: string
      transaction_amount: number
      currency_id: string
      description: string
      payment_method_id: string
      payer: {
        id: number
        email: string
      }
      card?: {
        first_six_digits: string
        last_four_digits: string
      }
    }>("/v1/payments", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: data.transaction_amount,
        description: data.description,
        token: data.token,
        installments: data.installments || 1,
        payer: data.payer,
        capture: true,
        statement_descriptor: "SLEEPCOMET",
      }),
    })
  }

  // ==================== CUSTOMERS ====================

  /**
   * Search customer by email
   */
  async searchCustomer(email: string) {
    return this.request<{
      paging: {
        limit: number
        offset: number
        total: number
      }
      results: Array<{
        id: string
        email: string
        first_name: string
        last_name: string
        phone: {
          area_code: string
          number: string
        }
        identification: {
          type: string
          number: string
        }
        date_registered: string
        cards: Array<{
          id: string
          customer_id: string
          expiration_month: number
          expiration_year: number
          first_six_digits: string
          last_four_digits: string
          payment_method: {
            id: string
            name: string
            payment_type_id: string
          }
          issuer: {
            id: number
            name: string
          }
          cardholder: {
            name: string
            identification: {
              number: string
              type: string
            }
          }
          date_created: string
          date_last_updated: string
        }>
      }>
    }>(`/v1/customers/search?email=${encodeURIComponent(email)}`)
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    email: string
    first_name?: string
    last_name?: string
  }) {
    return this.request<{
      id: string
      email: string
      first_name: string
      last_name: string
      date_registered: string
    }>("/v1/customers", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Save card to customer
   */
  async saveCard(customerId: string, token: string) {
    return this.request<{
      id: string
      customer_id: string
      expiration_month: number
      expiration_year: number
      first_six_digits: string
      last_four_digits: string
      payment_method: {
        id: string
        name: string
      }
      issuer: {
        id: number
        name: string
      }
      cardholder: {
        name: string
      }
      date_created: string
    }>(`/v1/customers/${customerId}/cards`, {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  }

  // ==================== CARD TOKEN VALIDATION ====================

  /**
   * Get card token info
   */
  async getCardToken(tokenId: string) {
    return this.request<{
      id: string
      public_key: string
      first_six_digits: string
      last_four_digits: string
      expiration_month: number
      expiration_year: number
      cardholder: {
        name: string
        identification: {
          type: string
          number: string
        }
      }
      status: string
      date_created: string
      date_last_updated: string
    }>(`/v1/card_tokens/${tokenId}`)
  }
}

// Singleton instance
let mpClient: MercadoPagoClient | null = null

export function getMercadoPagoClient(): MercadoPagoClient {
  if (!mpClient) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured")
    }
    mpClient = new MercadoPagoClient({ accessToken })
  }
  return mpClient
}

export type { MercadoPagoClient }
