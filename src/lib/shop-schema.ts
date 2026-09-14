import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const product = sqliteTable(
  'product',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    colorHex: text('color_hex').notNull(),
    price: integer('price').notNull(),
    description: text('description').notNull(),
    fabric: text('fabric').notNull(),
    features: text('features').notNull().default('[]'),
    image: text('image').notNull(),
    images: text('images').notNull().default('[]'),
    imageAlt: text('image_alt').notNull(),
    preOrder: integer('pre_order', { mode: 'boolean' }).default(true).notNull(),
    active: integer('active', { mode: 'boolean' }).default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('product_active_sort_idx').on(table.active, table.sortOrder)],
)

export const productSize = sqliteTable(
  'product_size',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    size: text('size').notNull(),
    stock: integer('stock').default(0).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('product_size_product_size_uidx').on(table.productId, table.size),
    index('product_size_productId_idx').on(table.productId),
  ],
)

export const productRelations = relations(product, ({ many }) => ({
  sizes: many(productSize),
}))

export const productSizeRelations = relations(productSize, ({ one }) => ({
  product: one(product, {
    fields: [productSize.productId],
    references: [product.id],
  }),
}))

export const pickupPoint = sqliteTable(
  'pickup_point',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    city: text('city').notNull(),
    province: text('province').default('Bali').notNull(),
    postal: text('postal').notNull(),
    hours: text('hours').default('').notNull(),
    notes: text('notes').default('').notNull(),
    phone: text('phone').default('').notNull(),
    active: integer('active', { mode: 'boolean' }).default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('pickup_point_active_sort_idx').on(table.active, table.sortOrder)],
)
