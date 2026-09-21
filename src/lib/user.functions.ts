import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { desc, eq, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import { user, userProfile } from 'db/schemas/auth'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'

export type AdminUserListItem = {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  banned: boolean
  jerseySize: string
  verifiedAt: string | null
}

export type AdminUserAddress = {
  id: string
  label: string
  address: string
  apartment: string
  city: string
  province: string
  postal: string
  isDefault: boolean
}

export type AdminUserDetail = {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  banned: boolean
  banReason: string | null
  banExpires: string | null
  emailVerified: boolean
  createdAt: string
  profile: {
    firstName: string
    lastName: string
    phone: string
    gender: string
    bloodType: string
    dateOfBirth: string
    nationality: string
    idNumber: string
    emergencyContactName: string
    emergencyContactPhone: string
    jerseySize: string
  }
  shippingAddresses: AdminUserAddress[]
}

function toIso(value: Date | number | string | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function displayName(
  row: { name: string; email: string },
  profile?: { firstName: string | null; lastName: string | null } | null,
) {
  const fromParts = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
  return fromParts || row.name.trim() || row.email
}

async function requireAdmin() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session || !hasAdminRole(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

export const listUsers = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      q: z.string().trim().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const query = data.q?.trim() ?? ''
    const pattern = query
      ? `%${query.toLowerCase().replace(/[%_]/g, '')}%`
      : null

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        jerseySize: userProfile.jerseySize,
        verifiedAt: userProfile.verifiedAt,
      })
      .from(user)
      .leftJoin(userProfile, eq(userProfile.userId, user.id))
      .where(
        pattern
          ? or(
              like(sql`lower(${user.name})`, pattern),
              like(sql`lower(${user.email})`, pattern),
              like(
                sql`lower(coalesce(${userProfile.firstName}, ''))`,
                pattern,
              ),
              like(
                sql`lower(coalesce(${userProfile.lastName}, ''))`,
                pattern,
              ),
              like(
                sql`lower(trim(coalesce(${userProfile.firstName}, '') || ' ' || coalesce(${userProfile.lastName}, '')))`,
                pattern,
              ),
            )
          : undefined,
      )
      .orderBy(desc(user.createdAt))
      .limit(100)

    return {
      total: rows.length,
      users: rows.map((row) => {
        const name = displayName(row, {
          firstName: row.firstName,
          lastName: row.lastName,
        })
        return {
          id: row.id,
          name,
          email: row.email,
          image: row.image ?? null,
          role: row.role || 'user',
          banned: Boolean(row.banned),
          jerseySize: row.jerseySize || 'M',
          verifiedAt: toIso(row.verifiedAt),
        } satisfies AdminUserListItem
      }),
    }
  })

export const getUserById = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<AdminUserDetail | null> => {
    await requireAdmin()
    const row = await db.query.user.findFirst({
      where: eq(user.id, data.id),
      with: { profile: true, shippingAddresses: true },
    })
    if (!row) return null

    const addresses = [...row.shippingAddresses].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      const aTime =
        a.updatedAt instanceof Date ? a.updatedAt.getTime() : Number(a.updatedAt)
      const bTime =
        b.updatedAt instanceof Date ? b.updatedAt.getTime() : Number(b.updatedAt)
      return bTime - aTime
    })

    const name = displayName(row, row.profile)

    return {
      id: row.id,
      name,
      email: row.email,
      image: row.image ?? null,
      role: row.role || 'user',
      banned: Boolean(row.banned),
      banReason: row.banReason ?? null,
      banExpires: toIso(row.banExpires),
      emailVerified: Boolean(row.emailVerified),
      createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
      profile: {
        firstName: row.profile?.firstName?.trim() || '',
        lastName: row.profile?.lastName?.trim() || '',
        phone: row.profile?.phone?.trim() || '',
        gender: row.profile?.gender?.trim() || '',
        bloodType: row.profile?.bloodType?.trim() || '',
        dateOfBirth: row.profile?.dateOfBirth?.trim() || '',
        nationality: row.profile?.nationality?.trim() || '',
        idNumber: row.profile?.idNumber?.trim() || '',
        emergencyContactName: row.profile?.emergencyContactName?.trim() || '',
        emergencyContactPhone: row.profile?.emergencyContactPhone?.trim() || '',
        jerseySize: row.profile?.jerseySize || 'M',
      },
      shippingAddresses: addresses.map((address) => ({
        id: address.id,
        label: address.label || 'Home',
        address: address.address ?? '',
        apartment: address.apartment ?? '',
        city: address.city ?? '',
        province: address.province || 'Bali',
        postal: address.postal ?? '',
        isDefault: address.isDefault,
      })),
    }
  })

export const markUserVerified = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const account = await db.query.user.findFirst({
      where: eq(user.id, data.id),
    })
    if (!account) {
      throw new Error('User not found')
    }

    const existing = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, data.id),
    })
    const verifiedAt = existing?.verifiedAt ?? new Date()

    if (existing) {
      if (!existing.verifiedAt) {
        await db
          .update(userProfile)
          .set({ verifiedAt, updatedAt: new Date() })
          .where(eq(userProfile.userId, data.id))
      }
    } else {
      await db.insert(userProfile).values({
        userId: data.id,
        verifiedAt,
      })
    }

    return { verifiedAt: toIso(verifiedAt) }
  })

export const adminUserRoles = ['user', 'staff', 'admin'] as const
export type AdminUserRole = (typeof adminUserRoles)[number]

export const updateUserRole = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().min(1),
      role: z.enum(adminUserRoles),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    if (session.user.id === data.id && data.role !== 'admin') {
      throw new Error('You cannot remove your own admin role')
    }

    const headers = getRequestHeaders()
    await auth.api.setRole({
      body: {
        userId: data.id,
        role: data.role,
      },
      headers,
    })

    return { id: data.id, role: data.role }
  })
