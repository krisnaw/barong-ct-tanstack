import { env } from 'cloudflare:workers'

function stripSlash(value: string) {
  return value.replace(/\/$/, '')
}

function isLocalHost(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value)
}

export function paymentPublicUrl() {
  const explicit = env.PAYMENT_PUBLIC_URL?.trim()
  if (explicit) return stripSlash(explicit)

  const auth = env.BETTER_AUTH_URL?.trim()
  if (auth && !isLocalHost(auth)) return stripSlash(auth)

  return 'https://staging.barongcycling.com'
}
