import { env } from 'cloudflare:workers'

function stripSlash(value: string) {
  return value.replace(/\/$/, '')
}

function isLocalHost(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value)
}

/**
 * Public origin for assets linked from emails.
 * Mail clients cannot load localhost URLs, so prefer a public host.
 */
export function emailPublicBaseUrl() {
  const payment = env.PAYMENT_PUBLIC_URL?.trim()
  if (payment && !isLocalHost(payment)) return stripSlash(payment)

  const auth = env.BETTER_AUTH_URL?.trim()
  if (auth && !isLocalHost(auth)) return stripSlash(auth)

  return 'https://www.barongmelali.com'
}

export function emailLogoUrl() {
  return `${emailPublicBaseUrl()}/barong-no-bg.png`
}
