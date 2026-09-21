import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const event = sqliteTable(
  'event',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    regulation: text('regulation'),
    featureImage: text('feature_image'),
    featureImageAlt: text('feature_image_alt'),
    kind: text('kind').notNull().default('free'),
    status: text('status').notNull().default('draft'),
    eventDate: text('event_date').notNull(),
    eventTime: text('event_time').notNull().default('05:30'),
    timeZone: text('time_zone').notNull().default('GMT+8'),
    locationName: text('location_name').notNull(),
    locationAddress: text('location_address'),
    registrationClosesAt: text('registration_closes_at'),
    hasJersey: integer('has_jersey', { mode: 'boolean' })
      .default(false)
      .notNull(),
    isGroupRide: integer('is_group_ride', { mode: 'boolean' })
      .default(false)
      .notNull(),
    groupCapacity: integer('group_capacity'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('event_status_date_idx').on(table.status, table.eventDate),
    index('event_kind_idx').on(table.kind),
  ],
)
