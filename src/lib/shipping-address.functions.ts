import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { db } from '~/lib/db'
import { userShippingAddress } from '~/lib/auth-schema'

export type ShippingAddressRow = {
  id: string
  label: string
  address: string
  apartment: string
  city: string
  province: string
  postal: string
  isDefault: boolean
}

const shippingAddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  address: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal: z.string().optional(),
})

function mapRow(row: typeof userShippingAddress.$inferSelect): ShippingAddressRow {
  return {
    id: row.id,
    label: row.label || 'Home',
    address: row.address ?? '',
    apartment: row.apartment ?? '',
    city: row.city ?? '',
    province: row.province || 'Bali',
    postal: row.postal ?? '',
    isDefault: row.isDefault,
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

async function listForUser(userId: string) {
  const rows = await db.query.userShippingAddress.findMany({
    where: eq(userShippingAddress.userId, userId),
    orderBy: [desc(userShippingAddress.isDefault), desc(userShippingAddress.updatedAt)],
  })
  return rows.map(mapRow)
}

export const getMyShippingAddresses = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireSession()
    return listForUser(session.user.id)
  },
)

export const upsertMyShippingAddress = createServerFn({ method: 'POST' })
  .validator(shippingAddressSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    const userId = session.user.id
    const existing = await listForUser(userId)
    const current = data.id
      ? existing.find((row) => row.id === data.id)
      : existing[0]

    if (!current && existing.length > 0) {
      throw new Error('Only one shipping address can be saved for now')
    }

    const next = {
      label: (data.label ?? current?.label ?? 'Home').trim() || 'Home',
      address: (data.address ?? current?.address ?? '').trim() || null,
      apartment: (data.apartment ?? current?.apartment ?? '').trim() || null,
      city: (data.city ?? current?.city ?? '').trim() || null,
      province: (data.province ?? current?.province ?? 'Bali').trim() || 'Bali',
      postal: (data.postal ?? current?.postal ?? '').trim() || null,
      isDefault: true,
      updatedAt: new Date(),
    }

    const id = current?.id ?? crypto.randomUUID()
    if (current) {
      await db
        .update(userShippingAddress)
        .set(next)
        .where(eq(userShippingAddress.id, id))
    } else {
      await db.insert(userShippingAddress).values({
        id,
        userId,
        ...next,
      })
    }

    const saved = await db.query.userShippingAddress.findFirst({
      where: eq(userShippingAddress.id, id),
    })
    if (!saved) {
      throw new Error('Failed to save shipping address')
    }
    return mapRow(saved)
  })
