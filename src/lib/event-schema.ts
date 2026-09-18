import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from '~/lib/auth-schema'

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

export const eventRelations = relations(event, ({ many }) => ({
  categories: many(eventCategory),
  groups: many(eventGroup),
  participants: many(eventParticipant),
  promos: many(eventPromo),
}))

export const eventCategoryRelations = relations(eventCategory, ({ one, many }) => ({
  event: one(event, {
    fields: [eventCategory.eventId],
    references: [event.id],
  }),
  groups: many(eventGroup),
  participants: many(eventParticipant),
}))

export const eventGroupRelations = relations(eventGroup, ({ one, many }) => ({
  event: one(event, {
    fields: [eventGroup.eventId],
    references: [event.id],
  }),
  category: one(eventCategory, {
    fields: [eventGroup.eventCategoryId],
    references: [eventCategory.id],
  }),
  participants: many(eventParticipant),
}))

export const eventParticipantRelations = relations(
  eventParticipant,
  ({ one }) => ({
    event: one(event, {
      fields: [eventParticipant.eventId],
      references: [event.id],
    }),
    user: one(user, {
      fields: [eventParticipant.userId],
      references: [user.id],
    }),
    category: one(eventCategory, {
      fields: [eventParticipant.eventCategoryId],
      references: [eventCategory.id],
    }),
    group: one(eventGroup, {
      fields: [eventParticipant.eventGroupId],
      references: [eventGroup.id],
    }),
  }),
)

export const eventPromoRelations = relations(eventPromo, ({ one }) => ({
  event: one(event, {
    fields: [eventPromo.eventId],
    references: [event.id],
  }),
}))
