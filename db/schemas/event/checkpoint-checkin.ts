import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from '../auth'
import { eventCheckpoint } from './checkpoint'
import { eventParticipant } from './participant'

export const checkpointCheckin = sqliteTable(
  'checkpoint_checkin',
  {
    id: text('id').primaryKey(),
    checkpointId: text('checkpoint_id')
      .notNull()
      .references(() => eventCheckpoint.id, { onDelete: 'cascade' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => eventParticipant.id, { onDelete: 'cascade' }),
    checkedInAt: integer('checked_in_at', { mode: 'timestamp_ms' }).notNull(),
    checkedInBy: text('checked_in_by').references(() => user.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('checkpoint_checkin_checkpointId_idx').on(table.checkpointId),
    index('checkpoint_checkin_participantId_idx').on(table.participantId),
    uniqueIndex('checkpoint_checkin_checkpoint_participant_uidx').on(
      table.checkpointId,
      table.participantId,
    ),
  ],
)
