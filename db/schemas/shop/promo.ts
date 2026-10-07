import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const shopPromo = sqliteTable(
  'shop_promo',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    discountType: text('discount_type').default('percent').notNull(),
    discountValue: integer('discount_value').notNull(),
    currency: text('currency').default('IDR').notNull(),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('shop_promo_code_uidx').on(table.code)],
)
