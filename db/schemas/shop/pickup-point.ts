import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
