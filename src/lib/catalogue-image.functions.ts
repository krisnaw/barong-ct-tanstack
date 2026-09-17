import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { catalogueObjectKey } from '~/lib/catalogue-image'

const MAX_BYTES = 5 * 1024 * 1024

const contentTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

const uploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().min(1),
})

async function requireAdmin() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session || !hasAdminRole(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

function publicCatalogueImageUrl(imageId: string) {
  const base = (env.BETTER_AUTH_URL || '').replace(/\/$/, '')
  return `${base}/api/catalogue-images/${imageId}?v=${Date.now()}`
}

function decodeBase64(data: string) {
  const normalized = data.includes(',') ? data.split(',')[1]! : data
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export const uploadCatalogueImage = createServerFn({ method: 'POST' })
  .validator(uploadSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const bytes = decodeBase64(data.data)
    if (bytes.byteLength > MAX_BYTES) {
      throw new Error('Image must be 5MB or smaller')
    }

    const imageId = crypto.randomUUID()
    const key = catalogueObjectKey(imageId)
    await env.AVATARS.put(key, bytes, {
      httpMetadata: {
        contentType: data.contentType,
      },
      customMetadata: {
        ext: contentTypes[data.contentType],
      },
    })

    return {
      imageId,
      url: publicCatalogueImageUrl(imageId),
    }
  })
