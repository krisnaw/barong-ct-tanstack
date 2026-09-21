import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
    membersOnly: integer('members_only', { mode: 'boolean' })
      .default(false)
      .notNull(),
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
