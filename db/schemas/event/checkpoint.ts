import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { event } from './event'

/** Race / ride checkpoints for an event. */
export const eventCheckpoint = sqliteTable(
  'event_checkpoint',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('event_checkpoint_eventId_idx').on(table.eventId),
    uniqueIndex('event_checkpoint_event_name_uidx').on(table.eventId, table.name),
    uniqueIndex('event_checkpoint_event_sort_uidx').on(
      table.eventId,
      table.sortOrder,
    ),
  ],
)
