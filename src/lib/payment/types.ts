export type PaymentProviderName = 'stub' | 'doku'

export type PaymentMethod = {
  id: string
  label: string
  detail: string
}

export type CreateCheckoutInput = {
  orderNumber: string
  amount: number
  currency: 'IDR'
  customer: {
    email: string
    firstName: string
    lastName: string
    phone: string
  }
  items: { name: string; quantity: number; price: number }[]
  returnUrl: string
  cancelUrl: string
}

export type CheckoutSession = {
  transactionId: string
  url: string
  expiresAt?: Date
}

export type PaymentEventStatus = 'paid' | 'failed' | 'expired' | 'pending'

export type PaymentEvent = {
  transactionId: string
  status: PaymentEventStatus
  method?: string
  payload?: unknown
}

export type PaymentProvider = {
  name: PaymentProviderName
  displayName: string
  methods: PaymentMethod[]
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>
  parseWebhook(request: Request): Promise<PaymentEvent | null>
}

export type PaymentDisplay = {
  name: PaymentProviderName
  displayName: string
  methods: PaymentMethod[]
}
