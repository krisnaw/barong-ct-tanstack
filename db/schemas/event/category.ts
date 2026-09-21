import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { event } from './event'

export const eventCategory = sqliteTable(
  'event_category',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    distance: text('distance'),
    price: integer('price').default(0).notNull(),
    serviceFee: integer('service_fee').default(0).notNull(),
    currency: text('currency').default('IDR').notNull(),
    maxParticipants: integer('max_participants'),
    gpxRoute: text('gpx_route'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('event_category_eventId_idx').on(table.eventId)],
)
