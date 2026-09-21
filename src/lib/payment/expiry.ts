export function isCheckoutExpired(
  expiresAt: Date | number | null | undefined,
  createdAt: Date | number,
  fallbackMinutes: number,
) {
  const createdMs =
    createdAt instanceof Date ? createdAt.getTime() : Number(createdAt)
  const expiryMs =
    expiresAt == null
      ? createdMs + fallbackMinutes * 60_000
      : expiresAt instanceof Date
        ? expiresAt.getTime()
        : Number(expiresAt)
  if (Number.isNaN(expiryMs)) return true
  return Date.now() >= expiryMs
}
