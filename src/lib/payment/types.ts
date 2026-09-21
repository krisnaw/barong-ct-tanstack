export type PaymentProviderName = 'stub' | 'doku'

/** Checkout UI / createCheckout method ids */
export const PAYMENT_METHOD_IDS = ['qris_va', 'card'] as const
export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number]

export type PaymentMethod = {
  id: PaymentMethodId
  label: string
  detail: string
}

export type CreateCheckoutInput = {
  orderNumber: string
  amount: number
  currency: 'IDR'
  methodId: PaymentMethodId
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
