export function catalogueObjectKey(imageId: string) {
  return `catalogue/${imageId}`
}

/** Domain-independent public path for a catalogue image. */
export function catalogueImagePath(imageId: string) {
  return `/api/catalogue-images/${imageId}`
}

/**
 * Strip origin from our catalogue image URLs so stored refs survive domain
 * changes. Leaves relative paths and third-party URLs unchanged.
 */
export function normalizeStoredImageRef(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.pathname.startsWith('/api/catalogue-images/')) {
      return url.pathname
    }
  } catch {
    // keep original
  }
  return trimmed
}
