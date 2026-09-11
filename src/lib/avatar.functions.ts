import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { user } from '~/lib/auth-schema'
import { db } from '~/lib/db'

const MAX_BYTES = 2 * 1024 * 1024

const contentTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

const uploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().min(1),
})

async function requireSession() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

function objectKey(userId: string) {
  return `avatars/${userId}`
}

function publicAvatarUrl(userId: string) {
  const base = (env.BETTER_AUTH_URL || '').replace(/\/$/, '')
  return `${base}/api/avatars/${userId}?v=${Date.now()}`
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

export const uploadAvatar = createServerFn({ method: 'POST' })
  .validator(uploadSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    const bytes = decodeBase64(data.data)
    if (bytes.byteLength > MAX_BYTES) {
      throw new Error('Image must be 2MB or smaller')
    }

    const key = objectKey(session.user.id)
    await env.AVATARS.put(key, bytes, {
      httpMetadata: {
        contentType: data.contentType,
      },
      customMetadata: {
        userId: session.user.id,
        ext: contentTypes[data.contentType],
      },
    })

    const image = publicAvatarUrl(session.user.id)
    await db
      .update(user)
      .set({ image, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    return { image }
  })

export const removeAvatar = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await requireSession()
    await env.AVATARS.delete(objectKey(session.user.id))
    await db
      .update(user)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))
    return { image: null as string | null }
  },
)
