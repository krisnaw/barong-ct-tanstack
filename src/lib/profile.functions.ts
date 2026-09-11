import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { user, userProfile } from '~/lib/auth-schema'
import { db } from '~/lib/db'

const profilePatchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  jerseySize: z.string().optional(),
  address: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal: z.string().optional(),
})

export type UserProfileRow = {
  firstName: string
  lastName: string
  phone: string
  jerseySize: string
  address: string
  apartment: string
  city: string
  province: string
  postal: string
}

function emptyProfile(): UserProfileRow {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    jerseySize: 'M',
    address: '',
    apartment: '',
    city: '',
    province: 'Bali',
    postal: '',
  }
}

function splitName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName: firstName ?? '', lastName: rest.join(' ') }
}

function mapRow(
  row: typeof userProfile.$inferSelect | undefined,
  fallbackName: string,
): UserProfileRow {
  const split = splitName(fallbackName)
  if (!row) {
    return {
      ...emptyProfile(),
      firstName: split.firstName,
      lastName: split.lastName,
    }
  }
  return {
    firstName: row.firstName?.trim() || split.firstName,
    lastName: row.lastName?.trim() || split.lastName,
    phone: row.phone ?? '',
    jerseySize: row.jerseySize || 'M',
    address: row.address ?? '',
    apartment: row.apartment ?? '',
    city: row.city ?? '',
    province: row.province || 'Bali',
    postal: row.postal ?? '',
  }
}

async function requireSession() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export const getMyProfile = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireSession()
    const row = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id),
    })
    return {
      email: session.user.email,
      name: session.user.name,
      avatarUrl: session.user.image ?? '',
      ...mapRow(row, session.user.name),
    }
  },
)

export const upsertMyProfile = createServerFn({ method: 'POST' })
  .validator(profilePatchSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    const userId = session.user.id
    const existing = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, userId),
    })
    const current = mapRow(existing, session.user.name)

    const next: UserProfileRow = {
      firstName:
        data.firstName !== undefined ? data.firstName.trim() : current.firstName,
      lastName:
        data.lastName !== undefined ? data.lastName.trim() : current.lastName,
      phone: data.phone !== undefined ? data.phone.trim() : current.phone,
      jerseySize:
        data.jerseySize !== undefined ? data.jerseySize : current.jerseySize,
      address: data.address !== undefined ? data.address.trim() : current.address,
      apartment:
        data.apartment !== undefined ? data.apartment.trim() : current.apartment,
      city: data.city !== undefined ? data.city.trim() : current.city,
      province:
        data.province !== undefined ? data.province.trim() : current.province,
      postal: data.postal !== undefined ? data.postal.trim() : current.postal,
    }

    const values = {
      userId,
      firstName: next.firstName || null,
      lastName: next.lastName || null,
      phone: next.phone || null,
      jerseySize: next.jerseySize || 'M',
      address: next.address || null,
      apartment: next.apartment || null,
      city: next.city || null,
      province: next.province || 'Bali',
      postal: next.postal || null,
      updatedAt: new Date(),
    }

    if (existing) {
      await db
        .update(userProfile)
        .set(values)
        .where(eq(userProfile.userId, userId))
    } else {
      await db.insert(userProfile).values(values)
    }

    const displayName = `${next.firstName} ${next.lastName}`.trim()
    if (displayName && displayName !== session.user.name) {
      await db
        .update(user)
        .set({ name: displayName, updatedAt: new Date() })
        .where(eq(user.id, userId))
    }

    return {
      email: session.user.email,
      name: displayName || session.user.name,
      ...next,
    }
  })
