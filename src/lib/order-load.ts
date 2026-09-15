import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  resolveOrderStatus,
  type PaymentStatus,
  type ShopOrder,
  type ShopOrderLine,
  type ShopPayment,
} from '~/data/orders'
import type { CustomMeasurements } from '~/data/shop'
import { db } from '~/lib/db'
import { lineItems, orders, payment } from '~/lib/order-schema'

const customSchema = z.object({
  chest: z.string(),
  sleeve: z.string(),
  frontZipper: z.string(),
  back: z.string(),
})

function parseCustom(value: string | null): CustomMeasurements | undefined {
  if (!value) return undefined
  try {
    return customSchema.parse(JSON.parse(value))
  } catch {
    return undefined
  }
}

function toIso(value: Date | number | string | null | undefined) {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function pickCurrentPayment(
  rows: (typeof payment.$inferSelect)[],
): typeof payment.$inferSelect | null {
  const paid = rows.find((row) => row.status === 'paid')
  if (paid) return paid
  return (
    [...rows].sort((a, b) => {
      const aTime =
        a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt)
      const bTime =
        b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt)
      return bTime - aTime
    })[0] ?? null
  )
}

function mapPayment(row: typeof payment.$inferSelect): ShopPayment {
  return {
    provider: row.provider,
    transactionId: row.transactionId,
    status: row.status as PaymentStatus,
    method: row.method ?? undefined,
    amount: row.amount,
    paidAt: toIso(row.paidAt),
  }
}

function mapLine(row: typeof lineItems.$inferSelect): ShopOrderLine {
  const custom = parseCustom(row.custom)
  return {
    slug: row.slug,
    name: row.name,
    color: row.color,
    size: row.size,
    quantity: row.quantity,
    price: row.price,
    image: row.image,
    custom,
    preOrder: row.preOrder,
  }
}

export function mapOrder(
  row: typeof orders.$inferSelect,
  lines: (typeof lineItems.$inferSelect)[],
  payments: (typeof payment.$inferSelect)[] = [],
): ShopOrder {
  const current = pickCurrentPayment(payments)
  return {
    id: row.number,
    placedAt: toIso(row.placedAt) ?? new Date().toISOString(),
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    delivery:
      row.pickupPointId || row.shippingSpeed === 'pickup' ? 'pickup' : 'ship',
    pickupPointId: row.pickupPointId ?? undefined,
    address: [row.address, row.apartment].filter(Boolean).join(', '),
    city: row.city,
    province: row.province,
    postal: row.postal,
    shippingLabel: row.shippingLabel,
    courier: row.courier ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    lines: lines.map(mapLine),
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    status: resolveOrderStatus(
      row.status,
      current?.status as PaymentStatus | undefined,
    ),
    payment: current ? mapPayment(current) : null,
  }
}

export async function loadShopOrderByDbId(
  id: string,
): Promise<ShopOrder | null> {
  const row = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { lines: true, payments: true },
  })
  if (!row) return null
  return mapOrder(row, row.lines, row.payments)
}
