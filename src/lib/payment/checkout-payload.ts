export type CheckoutPayload = {
  checkoutUrl?: string
  expiresAt?: string
}

export function parseCheckoutPayload(
  raw: string | null | undefined,
): CheckoutPayload {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const record = parsed as Record<string, unknown>
    return {
      checkoutUrl:
        typeof record.checkoutUrl === 'string' ? record.checkoutUrl : undefined,
      expiresAt:
        typeof record.expiresAt === 'string' ? record.expiresAt : undefined,
    }
  } catch {
    return {}
  }
}

export function checkoutPayloadJson(input: {
  checkoutUrl: string
  expiresAt?: Date
}) {
  const payload: CheckoutPayload = {
    checkoutUrl: input.checkoutUrl,
  }
  if (input.expiresAt) {
    payload.expiresAt = input.expiresAt.toISOString()
  }
  return JSON.stringify(payload)
}

export function mergePaymentPayload(
  existingRaw: string | null | undefined,
  eventPayload: unknown,
) {
  const checkout = parseCheckoutPayload(existingRaw)
  let next: Record<string, unknown> = {}
  if (eventPayload && typeof eventPayload === 'object') {
    next = { ...(eventPayload as Record<string, unknown>) }
  } else if (existingRaw) {
    try {
      const parsed = JSON.parse(existingRaw) as unknown
      if (parsed && typeof parsed === 'object') {
        next = { ...(parsed as Record<string, unknown>) }
      }
    } catch {
      next = {}
    }
  }
  if (checkout.checkoutUrl) next.checkoutUrl = checkout.checkoutUrl
  if (checkout.expiresAt) next.expiresAt = checkout.expiresAt
  return JSON.stringify(next)
}

export function isCheckoutExpired(
  expiresAt: string | undefined,
  createdAt: Date | number,
  fallbackMinutes: number,
) {
  const expiryMs = expiresAt
    ? Date.parse(expiresAt)
    : (createdAt instanceof Date ? createdAt.getTime() : Number(createdAt)) +
      fallbackMinutes * 60_000
  if (Number.isNaN(expiryMs)) return true
  return Date.now() >= expiryMs
}
