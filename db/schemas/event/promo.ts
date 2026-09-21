import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { event } from './event'

export const eventPromo = sqliteTable(
  'event_promo',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    promo: text('promo').notNull(),
    discountValue: integer('discount_value').notNull(),
    discountType: text('discount_type').default('fixed').notNull(),
    currency: text('currency').default('IDR').notNull(),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0).notNull(),
    startsAt: integer('starts_at', { mode: 'timestamp_ms' }),
    endsAt: integer('ends_at', { mode: 'timestamp_ms' }),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('event_promo_eventId_idx').on(table.eventId),
    uniqueIndex('event_promo_event_code_uidx').on(table.eventId, table.promo),
  ],
)
