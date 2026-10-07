import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import { product, productSize, shopPromo } from 'db/schemas/shop'
import type { ShopProduct } from '~/data/shop'
import { resolveShopDiscount } from '~/lib/shop-promo'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { normalizeStoredImageRef } from '~/lib/catalogue-image'

const sizeStockSchema = z.object({
  size: z.string().min(1),
  stock: z.number().int().min(0),
})

const productInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  price: z.number().int().positive(),
  description: z.string().min(1),
  fabric: z.string().optional(),
  features: z.array(z.string()).default([]),
  image: z.string().min(1),
  images: z.array(z.string()).default([]),
  imageAlt: z.string().min(1),
  preOrder: z.boolean().default(true),
  membersOnly: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  sizes: z.array(sizeStockSchema).min(1),
})

const updateProductSchema = productInputSchema.extend({
  id: z.string().min(1),
})

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function mapProduct(
  row: typeof product.$inferSelect,
  sizeRows: (typeof productSize.$inferSelect)[],
): ShopProduct {
  const ordered = [...sizeRows].sort((a, b) => a.sortOrder - b.sortOrder)
  const stockBySize: Record<string, number> = {}
  for (const size of ordered) {
    stockBySize[size.size] = size.stock
  }
  const images = parseJsonArray(row.images).map(normalizeStoredImageRef)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
    colorHex: row.colorHex,
    price: row.price,
    description: row.description,
    fabric: row.fabric,
    features: parseJsonArray(row.features),
    sizes: ordered.map((size) => size.size),
    stockBySize,
    preOrder: row.preOrder,
    membersOnly: row.membersOnly,
    active: row.active,
    image: normalizeStoredImageRef(row.image),
    images: images.length > 0 ? images : [normalizeStoredImageRef(row.image)],
    imageAlt: row.imageAlt,
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

async function isVerifiedMember() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return Boolean(session?.user?.emailVerified)
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function loadAllProducts(activeOnly: boolean) {
  const rows = await db.query.product.findMany({
    where: activeOnly ? eq(product.active, true) : undefined,
    with: { sizes: true },
    orderBy: [asc(product.sortOrder), asc(product.name)],
  })
  return rows.map((row) => mapProduct(row, row.sizes))
}

export const listProducts = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        activeOnly: z.boolean().optional(),
        includeInactive: z.boolean().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const includeInactive = data?.includeInactive === true
    if (includeInactive) {
      await requireAdmin()
      return loadAllProducts(false)
    }
    const products = await loadAllProducts(data?.activeOnly !== false)
    if (await isVerifiedMember()) return products
    return products.filter((item) => !item.membersOnly)
  })

export const getProductBySlug = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      slug: z.string().min(1),
      includeInactive: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const row = await db.query.product.findFirst({
      where: eq(product.slug, data.slug),
      with: { sizes: true },
    })
    if (!row) return null
    if (!row.active && !data.includeInactive) return null
    if (!row.active && data.includeInactive) {
      await requireAdmin()
    }
    if (row.membersOnly && !data.includeInactive) {
      if (!(await isVerifiedMember())) return null
    }
    return mapProduct(row, row.sizes)
  })

export const createProduct = createServerFn({ method: 'POST' })
  .validator(productInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const id = crypto.randomUUID()
    const slug = data.slug?.trim() || slugify(data.name)
    if (!slug) {
      throw new Error('Invalid slug')
    }

    const existing = await db.query.product.findFirst({
      where: eq(product.slug, slug),
    })
    if (existing) {
      throw new Error('A product with this slug already exists')
    }

    const images = (
      data.images.length > 0 ? data.images : data.image ? [data.image] : []
    ).map(normalizeStoredImageRef)
    const image = normalizeStoredImageRef(data.image)

    await db.batch([
      db.insert(product).values({
        id,
        slug,
        name: data.name.trim(),
        color: data.color?.trim() || data.name.trim(),
        colorHex: data.colorHex?.trim() || '#000000',
        price: data.price,
        description: data.description.trim(),
        fabric: data.fabric?.trim() || '',
        features: JSON.stringify(data.features),
        image,
        images: JSON.stringify(images),
        imageAlt: data.imageAlt.trim(),
        preOrder: data.preOrder,
        membersOnly: data.membersOnly,
        active: data.active,
        sortOrder: data.sortOrder,
      }),
      ...data.sizes.map((size, index) =>
        db.insert(productSize).values({
          id: crypto.randomUUID(),
          productId: id,
          size: size.size,
          stock: size.stock,
          sortOrder: index,
        }),
      ),
    ])

    const created = await db.query.product.findFirst({
      where: eq(product.id, id),
      with: { sizes: true },
    })
    if (!created) {
      throw new Error('Failed to create product')
    }
    return mapProduct(created, created.sizes)
  })

export const updateProduct = createServerFn({ method: 'POST' })
  .validator(updateProductSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.product.findFirst({
      where: eq(product.id, data.id),
      with: { sizes: true },
    })
    if (!existing) {
      throw new Error('Product not found')
    }

    const slug = data.slug?.trim() || slugify(data.name)
    if (!slug) {
      throw new Error('Invalid slug')
    }

    if (slug !== existing.slug) {
      const clash = await db.query.product.findFirst({
        where: eq(product.slug, slug),
      })
      if (clash) {
        throw new Error('A product with this slug already exists')
      }
    }

    const images = (
      data.images.length > 0 ? data.images : data.image ? [data.image] : []
    ).map(normalizeStoredImageRef)
    const image = normalizeStoredImageRef(data.image)

    const statements = [
      db
        .update(product)
        .set({
          slug,
          name: data.name.trim(),
          color: data.color?.trim() || existing.color,
          colorHex: data.colorHex?.trim() || existing.colorHex,
          price: data.price,
          description: data.description.trim(),
          fabric: data.fabric?.trim() || existing.fabric,
          features: JSON.stringify(data.features),
          image,
          images: JSON.stringify(images),
          imageAlt: data.imageAlt.trim(),
          preOrder: data.preOrder,
          membersOnly: data.membersOnly,
          active: data.active,
          sortOrder: data.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(product.id, data.id)),
      db.delete(productSize).where(eq(productSize.productId, data.id)),
      ...data.sizes.map((size, index) =>
        db.insert(productSize).values({
          id: crypto.randomUUID(),
          productId: data.id,
          size: size.size,
          stock: size.stock,
          sortOrder: index,
        }),
      ),
    ] as const

    await db.batch([...statements])

    const updated = await db.query.product.findFirst({
      where: eq(product.id, data.id),
      with: { sizes: true },
    })
    if (!updated) {
      throw new Error('Failed to update product')
    }
    return mapProduct(updated, updated.sizes)
  })

export type ShopPromoRow = {
  id: string
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  usageLimit: number | null
  usedCount: number
  isActive: boolean
}

const shopPromoInputSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['fixed', 'percent']),
  discountValue: z.number().int().positive(),
  usageLimit: z.number().int().positive().nullable(),
  isActive: z.boolean(),
})

export const previewShopPromo = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      code: z.string().min(1),
      subtotal: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error('Unauthorized')

    const resolved = await resolveShopDiscount(data.code, data.subtotal)
    if (!resolved) throw new Error('Invalid promo code')
    return {
      code: resolved.code,
      discountType: resolved.type,
      discountValue: resolved.value,
      amount: resolved.amount,
    }
  })

function mapShopPromo(row: typeof shopPromo.$inferSelect): ShopPromoRow {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType === 'percent' ? 'percent' : 'fixed',
    discountValue: row.discountValue,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    isActive: row.isActive,
  }
}

function assertShopPromoInput(data: z.infer<typeof shopPromoInputSchema>) {
  if (data.discountType === 'percent' && data.discountValue > 100) {
    throw new Error('Percent discount cannot exceed 100')
  }
}

export const listShopPromos = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    const rows = await db.query.shopPromo.findMany({
      orderBy: [asc(shopPromo.code)],
    })
    return rows.map(mapShopPromo)
  },
)

export const createShopPromo = createServerFn({ method: 'POST' })
  .validator(shopPromoInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const code = data.code.trim().toUpperCase()
    if (!code) throw new Error('Promo code is required')
    assertShopPromoInput(data)

    const duplicate = await db.query.shopPromo.findFirst({
      where: eq(shopPromo.code, code),
    })
    if (duplicate) throw new Error('That promo code already exists')

    await db.insert(shopPromo).values({
      id: crypto.randomUUID(),
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      currency: 'IDR',
      usageLimit: data.usageLimit,
      usedCount: 0,
      isActive: data.isActive,
    })

    return { ok: true as const }
  })

export const updateShopPromo = createServerFn({ method: 'POST' })
  .validator(shopPromoInputSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.shopPromo.findFirst({
      where: eq(shopPromo.id, data.id),
    })
    if (!existing) throw new Error('Promo not found')

    const code = data.code.trim().toUpperCase()
    if (!code) throw new Error('Promo code is required')
    assertShopPromoInput(data)

    const duplicate = await db.query.shopPromo.findFirst({
      where: eq(shopPromo.code, code),
    })
    if (duplicate && duplicate.id !== data.id) {
      throw new Error('That promo code already exists')
    }

    await db
      .update(shopPromo)
      .set({
        code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        usageLimit: data.usageLimit,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(shopPromo.id, data.id))

    return { ok: true as const }
  })

export const deleteShopPromo = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.shopPromo.findFirst({
      where: eq(shopPromo.id, data.id),
    })
    if (!existing) throw new Error('Promo not found')
    if (existing.usedCount > 0) {
      throw new Error('Promo codes that have been used cannot be deleted')
    }

    const removed = await db
      .delete(shopPromo)
      .where(and(eq(shopPromo.id, data.id), eq(shopPromo.usedCount, 0)))
      .returning({ id: shopPromo.id })
    if (removed.length === 0) {
      throw new Error('Promo codes that have been used cannot be deleted')
    }

    return { ok: true as const }
  })
