import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import {
  discountAmount,
  parseDiscountCode,
  SHIPPING_RATES,
  type OrderStatus,
  type PaymentStatus,
  type ShopOrder,
  type ShopOrderLine,
  type ShopPayment,
} from '~/data/orders'
import {
  CUSTOM_SIZE,
  customMeasurementsComplete,
  isSizePurchasable,
  type CustomMeasurements,
} from '~/data/shop'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { db } from '~/lib/db'
import { lineItems, orders, payment } from '~/lib/order-schema'
import { product } from '~/lib/shop-schema'

const customSchema = z.object({
  chest: z.string(),
  sleeve: z.string(),
  frontZipper: z.string(),
  back: z.string(),
})

const placeOrderSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  apartment: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  postal: z.string().min(1),
  shippingAddressId: z.string().optional(),
  shippingSpeed: z.enum(['regular', 'express']),
  discountCode: z.string().optional(),
  lines: z
    .array(
      z.object({
        slug: z.string().min(1),
        size: z.string().min(1),
        quantity: z.number().int().positive(),
        custom: customSchema.optional(),
      }),
    )
    .min(1),
})

function parseCustom(value: string | null): CustomMeasurements | undefined {
  if (!value) return undefined
  try {
    const parsed = customSchema.parse(JSON.parse(value))
    return parsed
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
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt)
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt)
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

function mapOrder(
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
    delivery: 'ship',
    address: [row.address, row.apartment].filter(Boolean).join(', '),
    city: row.city,
    province: row.province,
    postal: row.postal,
    shippingLabel: row.shippingLabel,
    lines: lines.map(mapLine),
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    status: row.status as OrderStatus,
    payment: current ? mapPayment(current) : null,
  }
}

async function loadPayments(orderIds: string[]) {
  if (orderIds.length === 0) return []
  return db.select().from(payment).where(inArray(payment.orderId, orderIds))
}

async function loadMappedOrders(userId?: string) {
  const rows = userId
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.placedAt))
    : await db.select().from(orders).orderBy(desc(orders.placedAt))

  const ids = rows.map((row) => row.id)
  const lines =
    ids.length > 0
      ? await db.select().from(lineItems).where(inArray(lineItems.orderId, ids))
      : []
  const payments = await loadPayments(ids)
  const linesByOrder = new Map<string, (typeof lineItems.$inferSelect)[]>()
  for (const line of lines) {
    const current = linesByOrder.get(line.orderId) ?? []
    current.push(line)
    linesByOrder.set(line.orderId, current)
  }
  const paymentsByOrder = new Map<string, (typeof payment.$inferSelect)[]>()
  for (const row of payments) {
    const current = paymentsByOrder.get(row.orderId) ?? []
    current.push(row)
    paymentsByOrder.set(row.orderId, current)
  }
  return rows.map((row) =>
    mapOrder(row, linesByOrder.get(row.id) ?? [], paymentsByOrder.get(row.id) ?? []),
  )
}

async function requireSession() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

async function requireAdmin() {
  const session = await requireSession()
  if (!hasAdminRole(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

function generateOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `BCT-${suffix}`
}

export const placeOrder = createServerFn({ method: 'POST' })
  .validator(placeOrderSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    const slugs = [...new Set(data.lines.map((line) => line.slug))]
    const products = await db.query.product.findMany({
      where: inArray(product.slug, slugs),
      with: { sizes: true },
    })
    const productBySlug = new Map(products.map((row) => [row.slug, row]))

    const resolvedLines = data.lines.map((line) => {
      const row = productBySlug.get(line.slug)
      if (!row || !row.active) {
        throw new Error(`Unknown product: ${line.slug}`)
      }
      const stockBySize = Object.fromEntries(
        row.sizes.map((size) => [size.size, size.stock]),
      )
      const shopProduct = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        color: row.color,
        colorHex: row.colorHex,
        price: row.price,
        description: row.description,
        fabric: row.fabric,
        features: [],
        sizes: row.sizes.map((size) => size.size),
        stockBySize,
        preOrder: row.preOrder,
        image: row.image,
        images: [],
        imageAlt: row.imageAlt,
      }
      if (line.size === CUSTOM_SIZE) {
        if (!row.preOrder) {
          throw new Error(`${row.name} is not available in Custom size`)
        }
        if (!line.custom || !customMeasurementsComplete(line.custom)) {
          throw new Error('Enter custom measurements')
        }
      } else if (!isSizePurchasable(shopProduct, line.size)) {
        throw new Error(`${row.name} size ${line.size} is not available`)
      }

      return {
        productId: row.id,
        slug: row.slug,
        name: row.name,
        color: row.color,
        size: line.size,
        quantity: line.quantity,
        price: row.price,
        image: row.image,
        preOrder: row.preOrder,
        custom: line.size === CUSTOM_SIZE ? line.custom : undefined,
      }
    })

    const subtotal = resolvedLines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    )
    const discount = data.discountCode
      ? parseDiscountCode(data.discountCode)
      : null
    const savings = discountAmount(subtotal, discount)
    const shipping = SHIPPING_RATES[data.shippingSpeed].price
    const total = Math.max(subtotal - savings + shipping, 0)
    const rate = SHIPPING_RATES[data.shippingSpeed]

    const id = crypto.randomUUID()
    let number = generateOrderNumber()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await db.query.orders.findFirst({
        where: eq(orders.number, number),
      })
      if (!clash) break
      number = generateOrderNumber()
    }

    await db.batch([
      db.insert(orders).values({
        id,
        number,
        userId: session.user.id,
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        apartment: data.apartment?.trim() || null,
        city: data.city.trim(),
        province: data.province.trim(),
        postal: data.postal.trim(),
        shippingAddressId: data.shippingAddressId || null,
        shippingSpeed: data.shippingSpeed,
        shippingLabel: `${rate.label} · ${rate.detail}`,
        subtotal,
        shipping,
        discount: savings,
        total,
        discountCode: discount?.code ?? null,
        status: 'pending',
      }),
      ...resolvedLines.map((line) =>
        db.insert(lineItems).values({
          id: crypto.randomUUID(),
          orderId: id,
          productId: line.productId,
          slug: line.slug,
          name: line.name,
          color: line.color,
          size: line.size,
          quantity: line.quantity,
          price: line.price,
          image: line.image,
          preOrder: line.preOrder,
          custom: line.custom ? JSON.stringify(line.custom) : null,
        }),
      ),
    ])

    const created = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { lines: true, payments: true },
    })
    if (!created) {
      throw new Error('Failed to place order')
    }
    return mapOrder(created, created.lines, created.payments)
  })

export const listMyOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await requireSession()
    return loadMappedOrders(session.user.id)
  },
)

export const listOrders = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return loadMappedOrders()
})

export const getOrderById = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const session = await requireSession()
    const row = await db.query.orders.findFirst({
      where: eq(orders.number, data.id),
      with: { lines: true, payments: true },
    })
    if (!row) return null
    if (row.userId !== session.user.id && !hasAdminRole(session.user.role)) {
      throw new Error('Unauthorized')
    }
    return mapOrder(row, row.lines, row.payments)
  })

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().min(1),
      status: z.enum(['pending', 'packed', 'shipped', 'completed', 'cancelled']),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.orders.findFirst({
      where: eq(orders.number, data.id),
      with: { lines: true, payments: true },
    })
    if (!existing) {
      throw new Error('Order not found')
    }
    await db
      .update(orders)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(orders.id, existing.id))
    return mapOrder({ ...existing, status: data.status }, existing.lines, existing.payments)
  })

export const updateOrderPayment = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().min(1),
      payment: z.enum(['unpaid', 'paid']),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.orders.findFirst({
      where: eq(orders.number, data.id),
      with: { lines: true, payments: true },
    })
    if (!existing) {
      throw new Error('Order not found')
    }

    const manualTxn = `manual:${existing.id}`
    const existingManual = existing.payments.find(
      (row) => row.provider === 'manual' && row.transactionId === manualTxn,
    )

    if (data.payment === 'paid') {
      if (existingManual) {
        await db
          .update(payment)
          .set({
            status: 'paid',
            paidAt: new Date(),
            amount: existing.total,
            updatedAt: new Date(),
          })
          .where(eq(payment.id, existingManual.id))
      } else {
        await db.insert(payment).values({
          id: crypto.randomUUID(),
          orderId: existing.id,
          provider: 'manual',
          transactionId: manualTxn,
          status: 'paid',
          amount: existing.total,
          paidAt: new Date(),
        })
      }
    } else {
      const paidRows = existing.payments.filter((row) => row.status === 'paid')
      for (const row of paidRows) {
        await db
          .update(payment)
          .set({ status: 'failed', paidAt: null, updatedAt: new Date() })
          .where(eq(payment.id, row.id))
      }
    }

    const next = await db.query.orders.findFirst({
      where: eq(orders.id, existing.id),
      with: { lines: true, payments: true },
    })
    if (!next) {
      throw new Error('Order not found')
    }
    return mapOrder(next, next.lines, next.payments)
  })
