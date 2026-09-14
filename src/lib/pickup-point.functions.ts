import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { db } from '~/lib/db'
import { pickupPoint } from '~/lib/shop-schema'
import type { PickupPoint } from '~/data/pickup-points'

const pickupPointInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  province: z.string().trim().min(1).max(80),
  postal: z.string().trim().min(1).max(12),
  hours: z.string().trim().max(120).default(''),
  notes: z.string().trim().max(400).default(''),
  phone: z.string().trim().max(32).default(''),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

const updatePickupPointSchema = pickupPointInputSchema.extend({
  id: z.string().min(1),
})

function mapPickupPoint(row: typeof pickupPoint.$inferSelect): PickupPoint {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    province: row.province,
    postal: row.postal,
    hours: row.hours,
    notes: row.notes,
    phone: row.phone,
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

async function requireAdmin() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session || !hasAdminRole(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

async function loadPickupPoints(activeOnly: boolean) {
  const rows = activeOnly
    ? await db
        .select()
        .from(pickupPoint)
        .where(eq(pickupPoint.active, true))
        .orderBy(asc(pickupPoint.sortOrder), asc(pickupPoint.name))
    : await db
        .select()
        .from(pickupPoint)
        .orderBy(asc(pickupPoint.sortOrder), asc(pickupPoint.name))
  return rows.map(mapPickupPoint)
}

async function loadPickupPoint(id: string) {
  const [row] = await db
    .select()
    .from(pickupPoint)
    .where(eq(pickupPoint.id, id))
    .limit(1)
  return row ? mapPickupPoint(row) : null
}

export const listPickupPoints = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        includeInactive: z.boolean().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const includeInactive = data?.includeInactive === true
    if (includeInactive) {
      await requireAdmin()
      return loadPickupPoints(false)
    }
    return loadPickupPoints(true)
  })

export const getPickupPoint = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    return loadPickupPoint(data.id)
  })

export const createPickupPoint = createServerFn({ method: 'POST' })
  .validator(pickupPointInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const id = crypto.randomUUID()
    await db.insert(pickupPoint).values({
      id,
      name: data.name,
      address: data.address,
      city: data.city,
      province: data.province,
      postal: data.postal,
      hours: data.hours,
      notes: data.notes,
      phone: data.phone,
      active: data.active,
      sortOrder: data.sortOrder,
    })

    const created = await loadPickupPoint(id)
    if (!created) {
      throw new Error('Failed to create pickup point')
    }
    return created
  })

export const updatePickupPoint = createServerFn({ method: 'POST' })
  .validator(updatePickupPointSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await loadPickupPoint(data.id)
    if (!existing) {
      throw new Error('Pickup point not found')
    }

    await db
      .update(pickupPoint)
      .set({
        name: data.name,
        address: data.address,
        city: data.city,
        province: data.province,
        postal: data.postal,
        hours: data.hours,
        notes: data.notes,
        phone: data.phone,
        active: data.active,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(pickupPoint.id, data.id))

    const updated = await loadPickupPoint(data.id)
    if (!updated) {
      throw new Error('Failed to update pickup point')
    }
    return updated
  })
