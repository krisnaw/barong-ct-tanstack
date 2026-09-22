import { env } from 'cloudflare:workers'
import { PAYMENT_DUE_MINUTES } from '~/lib/payment/config'
import {
  dokuCheckoutHeaders,
  dokuRequestHeaders,
  dokuVerifyWebhookSignature,
} from '~/lib/payment/doku-sign'
import { paymentPublicUrl } from '~/lib/payment/public-url'
import type {
  CreateCheckoutInput,
  PaymentEvent,
  PaymentEventStatus,
  PaymentMethodId,
  PaymentProvider,
} from '~/lib/payment/types'

const DOKU_METHOD_TYPES: Record<PaymentMethodId, string[]> = {
  qris_va: ['QRIS', 'VIRTUAL_ACCOUNT_BNI'],
  card: ['CREDIT_CARD'],
}

const CHECKOUT_PATH = '/checkout/v1/payment'

type DokuCheckoutResponse = {
  error_messages?: string[]
  message?: string[]
  response?: {
    order?: { invoice_number?: string; session_id?: string }
    payment?: { url?: string; token_id?: string; expired_date?: string }
  }
}

type DokuNotification = {
  order?: { invoice_number?: string; amount?: number; status?: string }
  transaction?: { status?: string }
  channel?: { id?: string; name?: string }
  service?: { id?: string }
}

function dokuEnv() {
  const apiUrl = env.DOKU_API_URL?.replace(/\/$/, '')
  const clientId = env.DOKU_CLIENT_ID
  const secret = env.DOKU_SECRET_KEY
  if (!apiUrl || !clientId || !secret) {
    throw new Error(
      'DOKU_API_URL, DOKU_CLIENT_ID, and DOKU_SECRET_KEY must be set',
    )
  }
  return { apiUrl, clientId, secret }
}

function invoiceNumber(orderNumber: string) {
  return `${orderNumber}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`
}

/** DOKU rejects characters outside this set in several string fields. */
function sanitizeDokuText(value: string, fallback = 'Barong') {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[^\w .\-\/+,=_:'@%()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || fallback
}

function idPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

function lineItems(input: CreateCheckoutInput) {
  const itemTotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  if (itemTotal === input.amount && input.items.length > 0) {
    return input.items.map((item, index) => ({
      id: String(index + 1),
      name: sanitizeDokuText(item.name, `Item ${index + 1}`),
      quantity: item.quantity,
      price: item.price,
      category: 'sports-and-outdoors',
    }))
  }
  return [
    {
      id: '1',
      name: sanitizeDokuText(
        `Barong order ${input.orderNumber}`,
        'Barong order',
      ),
      quantity: 1,
      price: input.amount,
      category: 'sports-and-outdoors',
    },
  ]
}

function parseExpiredDate(value?: string) {
  if (!value || value.length !== 14) return undefined
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1
  const day = Number(value.slice(6, 8))
  const hour = Number(value.slice(8, 10))
  const minute = Number(value.slice(10, 12))
  const second = Number(value.slice(12, 14))
  const date = new Date(Date.UTC(year, month, day, hour - 7, minute, second))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function mapMethod(channel?: string) {
  const value = (channel ?? '').toUpperCase()
  if (value.includes('QRIS')) return 'qris'
  if (value.includes('CREDIT_CARD') || value.includes('CARD')) return 'card'
  if (value.includes('VIRTUAL_ACCOUNT') || value.includes('VA')) return 'va'
  if (value.includes('EMONEY') || value.includes('WALLET')) return 'ewallet'
  return channel?.toLowerCase()
}

function mapStatus(status?: string): PaymentEventStatus | null {
  const value = (status ?? '').toUpperCase()
  if (value === 'SUCCESS' || value === 'ORDER_RECOVERED') return 'paid'
  if (value === 'EXPIRED' || value === 'ORDER_EXPIRED') return 'expired'
  if (value === 'PENDING' || value === 'FAILED' || value === 'ORDER_GENERATED') {
    return 'pending'
  }
  return null
}

function eventFromNotification(
  payload: DokuNotification,
  fallbackId: string,
): PaymentEvent | null {
  const transactionId = payload.order?.invoice_number ?? fallbackId
  const fromTx = mapStatus(payload.transaction?.status)
  const fromOrder = mapStatus(payload.order?.status)
  const status =
    fromTx === 'paid' || fromOrder === 'paid'
      ? 'paid'
      : fromTx === 'expired' || fromOrder === 'expired'
        ? 'expired'
        : (fromTx ?? fromOrder)
  if (!transactionId || !status) return null
  return {
    transactionId,
    status,
    method: mapMethod(payload.channel?.id ?? payload.service?.id),
  }
}

function header(request: Request, name: string) {
  return (
    request.headers.get(name) ??
    request.headers.get(name.toLowerCase()) ??
    request.headers.get(name.toUpperCase()) ??
    ''
  )
}

export const dokuProvider: PaymentProvider = {
  name: 'doku',
  displayName: 'DOKU',
  methods: [
    {
      id: 'qris_va',
      label: 'QRIS / BNI VA',
      detail: 'Pay with QRIS or BNI Virtual Account on the DOKU payment page.',
    },
    {
      id: 'card',
      label: 'Credit card',
      detail:
        'Visa, Mastercard, and other cards via DOKU. A service fee applies.',
    },
  ],
  async createCheckout(input) {
    const { apiUrl, clientId, secret } = dokuEnv()
    const invoice = invoiceNumber(input.orderNumber)
    const notifyUrl = `${paymentPublicUrl()}/api/payments/webhook/doku`
    const body = JSON.stringify({
      order: {
        amount: input.amount,
        invoice_number: invoice,
        currency: input.currency,
        callback_url: input.returnUrl,
        callback_url_cancel: input.cancelUrl,
        callback_url_result: input.returnUrl,
        language: 'EN',
        auto_redirect: true,
        line_items: lineItems(input),
      },
      payment: {
        payment_due_date: PAYMENT_DUE_MINUTES,
        payment_method_types: DOKU_METHOD_TYPES[input.methodId],
      },
      customer: {
        name: sanitizeDokuText(input.customer.firstName, 'Rider'),
        last_name: sanitizeDokuText(input.customer.lastName, 'Barong'),
        email: input.customer.email,
        phone: idPhone(input.customer.phone),
      },
      callbacks: {
        url: input.returnUrl,
      },
      additional_info: {
        override_notification_url: notifyUrl,
      },
    })

    const { headers } = dokuCheckoutHeaders({ clientId, secret, body })
    const response = await fetch(`${apiUrl}${CHECKOUT_PATH}`, {
      method: 'POST',
      headers,
      body,
    })
    const payload = (await response.json()) as DokuCheckoutResponse
    const url = payload.response?.payment?.url
    if (!response.ok || !url) {
      const messages = payload.error_messages ?? payload.message ?? []
      throw new Error(
        messages.length > 0
          ? `DOKU: ${messages.join('; ')}`
          : `DOKU checkout failed (${response.status})`,
      )
    }

    return {
      transactionId: payload.response?.order?.invoice_number ?? invoice,
      url,
      expiresAt: parseExpiredDate(payload.response?.payment?.expired_date),
    }
  },
  async parseWebhook(request) {
    const { secret, clientId } = dokuEnv()
    const body = await request.text()
    const requestId = header(request, 'Request-Id')
    const timestamp = header(request, 'Request-Timestamp')
    const signature = header(request, 'Signature')
    const incomingClientId = header(request, 'Client-Id') || clientId
    if (
      !dokuVerifyWebhookSignature({
        secret,
        clientId: incomingClientId,
        requestId,
        timestamp,
        requestTarget: '/api/payments/webhook/doku',
        body,
        signature,
      })
    ) {
      return null
    }

    let payload: DokuNotification
    try {
      payload = JSON.parse(body) as DokuNotification
    } catch {
      return null
    }

    return eventFromNotification(payload, '')
  },
}

export async function checkDokuPaymentStatus(invoiceNumber: string) {
  const { apiUrl, clientId, secret } = dokuEnv()
  const path = `/orders/v1/status/${encodeURIComponent(invoiceNumber)}`
  const { headers } = dokuRequestHeaders({
    clientId,
    secret,
    requestTarget: path,
  })
  const response = await fetch(`${apiUrl}${path}`, { method: 'GET', headers })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`DOKU status check failed (${response.status})`)
  }
  const payload = (await response.json()) as DokuNotification
  return eventFromNotification(payload, invoiceNumber)
}
