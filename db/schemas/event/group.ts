import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { eventCategory } from './category'
import { event } from './event'

export const eventGroup = sqliteTable(
  'event_group',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    eventCategoryId: text('event_category_id').references(() => eventCategory.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('event_group_eventId_idx').on(table.eventId),
    uniqueIndex('event_group_event_name_uidx').on(table.eventId, table.name),
  ],
)
