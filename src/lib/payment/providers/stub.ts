import { env } from 'cloudflare:workers'
import type { PaymentEvent, PaymentProvider } from '~/lib/payment/types'

function appBaseUrl() {
  return (env.BETTER_AUTH_URL || '').replace(/\/$/, '')
}

function stubSecret() {
  return (env as { PAYMENT_STUB_SECRET?: string }).PAYMENT_STUB_SECRET ?? ''
}

export const stubProvider: PaymentProvider = {
  name: 'stub',
  displayName: 'Test payment',
  methods: [
    {
      id: 'qris_va',
      label: 'QRIS / BNI VA',
      detail: 'Pay with QRIS or BNI Virtual Account on the test payment page.',
    },
    {
      id: 'card',
      label: 'Credit card',
      detail:
        'Visa, Mastercard, and other cards on the test payment page. A service fee applies.',
    },
  ],
  async createCheckout(input) {
    const base = appBaseUrl()
    return {
      transactionId: crypto.randomUUID(),
      url: `${base}/shop/checkout/simulate?order=${encodeURIComponent(input.orderNumber)}`,
    }
  },
  async parseWebhook(request) {
    const secret = stubSecret()
    if (!secret || request.headers.get('x-stub-secret') !== secret) {
      return null
    }
    try {
      const body = (await request.json()) as {
        transactionId?: string
        status?: PaymentEvent['status']
        method?: string
      }
      if (!body.transactionId || !body.status) return null
      return {
        transactionId: body.transactionId,
        status: body.status,
        method: body.method,
        payload: body,
      }
    } catch {
      return null
    }
  },
}
