import { env } from 'cloudflare:workers'

function stripSlash(value: string) {
  return value.replace(/\/$/, '')
}

function isLocalHost(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value)
}

/** Origin for shopper browser redirects after DOKU (can be localhost). */
export function appOriginUrl() {
  const auth = env.BETTER_AUTH_URL?.trim()
  if (auth) return stripSlash(auth)
  return paymentPublicUrl()
}

/**
 * Origin for payment return/cancel URLs sent to DOKU.
 * Prefer PAYMENT_PUBLIC_URL so staging/prod redirects match the public host
 * even if BETTER_AUTH_URL differs.
 */
export function checkoutOriginUrl() {
  const payment = env.PAYMENT_PUBLIC_URL?.trim()
  if (payment && !isLocalHost(payment)) return stripSlash(payment)
  return appOriginUrl()
}

/** Origin DOKU servers can reach for webhooks (must be public). */
export function paymentPublicUrl() {
  const explicit = env.PAYMENT_PUBLIC_URL?.trim()
  if (explicit) return stripSlash(explicit)

  const auth = env.BETTER_AUTH_URL?.trim()
  if (auth && !isLocalHost(auth)) return stripSlash(auth)

  return 'https://staging.barongmelali.com'
}
