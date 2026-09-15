import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const CHECKOUT_PATH = '/checkout/v1/payment'

export function dokuRequestTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function dokuDigest(body: string) {
  return createHash('sha256').update(body).digest('base64')
}

export function dokuSignatureComponents(input: {
  clientId: string
  requestId: string
  timestamp: string
  requestTarget: string
  digest?: string
}) {
  const lines = [
    `Client-Id:${input.clientId}`,
    `Request-Id:${input.requestId}`,
    `Request-Timestamp:${input.timestamp}`,
    `Request-Target:${input.requestTarget}`,
  ]
  if (input.digest) {
    lines.push(`Digest:${input.digest}`)
  }
  return lines.join('\n')
}

export function dokuSign(secret: string, component: string) {
  const value = createHmac('sha256', secret).update(component).digest('base64')
  return `HMACSHA256=${value}`
}

export function dokuRequestHeaders(input: {
  clientId: string
  secret: string
  requestTarget: string
  body?: string
  requestId?: string
}) {
  const requestId = input.requestId ?? crypto.randomUUID()
  const timestamp = dokuRequestTimestamp()
  const digest = input.body !== undefined ? dokuDigest(input.body) : undefined
  const signature = dokuSign(
    input.secret,
    dokuSignatureComponents({
      clientId: input.clientId,
      requestId,
      timestamp,
      requestTarget: input.requestTarget,
      digest,
    }),
  )
  return {
    requestId,
    headers: {
      ...(input.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      'Client-Id': input.clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      Signature: signature,
    },
  }
}

export function dokuCheckoutHeaders(input: {
  clientId: string
  secret: string
  body: string
  requestId?: string
}) {
  return dokuRequestHeaders({
    ...input,
    requestTarget: CHECKOUT_PATH,
  })
}

export function dokuVerifyWebhookSignature(input: {
  secret: string
  clientId: string
  requestId: string
  timestamp: string
  requestTarget: string
  body: string
  signature: string
}) {
  const expected = dokuSign(
    input.secret,
    dokuSignatureComponents({
      clientId: input.clientId,
      requestId: input.requestId,
      timestamp: input.timestamp,
      requestTarget: input.requestTarget,
      digest: dokuDigest(input.body),
    }),
  )
  const left = Buffer.from(expected)
  const right = Buffer.from(input.signature)
  return left.length === right.length && timingSafeEqual(left, right)
}
