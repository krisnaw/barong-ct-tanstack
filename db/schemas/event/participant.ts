import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from '../auth'
import { eventCategory } from './category'
import { event } from './event'
import { eventGroup } from './group'

export const eventParticipant = sqliteTable(
  'event_participant',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    eventCategoryId: text('event_category_id').references(() => eventCategory.id, {
      onDelete: 'set null',
    }),
    eventGroupId: text('event_group_id').references(() => eventGroup.id, {
      onDelete: 'set null',
    }),
    status: text('status').default('draft').notNull(),
    bibNumber: text('bib_number'),
    jerseySize: text('jersey_size'),
    price: integer('price').default(0).notNull(),
    serviceFee: integer('service_fee').default(0).notNull(),
    currency: text('currency').default('IDR').notNull(),
    promoId: text('promo_id'),
    promoCode: text('promo_code'),
    discountAmount: integer('discount_amount').default(0).notNull(),
    finalPrice: integer('final_price').default(0).notNull(),
    kitCollectedAt: integer('kit_collected_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('event_participant_user_event_uidx').on(table.userId, table.eventId),
    index('event_participant_eventId_idx').on(table.eventId),
    index('event_participant_status_idx').on(table.status),
  ],
)
