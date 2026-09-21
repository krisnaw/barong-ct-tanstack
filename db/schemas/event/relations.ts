import { relations } from 'drizzle-orm'
import { user } from '../auth'
import { eventCategory } from './category'
import { eventCheckpoint } from './checkpoint'
import { checkpointCategory } from './checkpoint-category'
import { checkpointCheckin } from './checkpoint-checkin'
import { event } from './event'
import { eventGroup } from './group'
import { eventParticipant } from './participant'
import { eventPromo } from './promo'

export const eventRelations = relations(event, ({ many }) => ({
  categories: many(eventCategory),
  groups: many(eventGroup),
  participants: many(eventParticipant),
  promos: many(eventPromo),
  checkpoints: many(eventCheckpoint),
}))

export const eventCategoryRelations = relations(eventCategory, ({ one, many }) => ({
  event: one(event, {
    fields: [eventCategory.eventId],
    references: [event.id],
  }),
  groups: many(eventGroup),
  participants: many(eventParticipant),
  checkpointLinks: many(checkpointCategory),
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
  ({ one, many }) => ({
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
    checkins: many(checkpointCheckin),
  }),
)

export const eventPromoRelations = relations(eventPromo, ({ one }) => ({
  event: one(event, {
    fields: [eventPromo.eventId],
    references: [event.id],
  }),
}))

export const eventCheckpointRelations = relations(
  eventCheckpoint,
  ({ one, many }) => ({
    event: one(event, {
      fields: [eventCheckpoint.eventId],
      references: [event.id],
    }),
    checkins: many(checkpointCheckin),
    categoryLinks: many(checkpointCategory),
  }),
)

export const checkpointCategoryRelations = relations(
  checkpointCategory,
  ({ one }) => ({
    checkpoint: one(eventCheckpoint, {
      fields: [checkpointCategory.checkpointId],
      references: [eventCheckpoint.id],
    }),
    category: one(eventCategory, {
      fields: [checkpointCategory.categoryId],
      references: [eventCategory.id],
    }),
  }),
)

export const checkpointCheckinRelations = relations(
  checkpointCheckin,
  ({ one }) => ({
    checkpoint: one(eventCheckpoint, {
      fields: [checkpointCheckin.checkpointId],
      references: [eventCheckpoint.id],
    }),
    participant: one(eventParticipant, {
      fields: [checkpointCheckin.participantId],
      references: [eventParticipant.id],
    }),
    checkedInByUser: one(user, {
      fields: [checkpointCheckin.checkedInBy],
      references: [user.id],
    }),
  }),
)
