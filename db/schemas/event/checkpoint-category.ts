import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { eventCategory } from './category'
import { eventCheckpoint } from './checkpoint'

/** Which event categories may use this checkpoint. No rows = all categories. */
export const checkpointCategory = sqliteTable(
  'checkpoint_category',
  {
    checkpointId: text('checkpoint_id')
      .notNull()
      .references(() => eventCheckpoint.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => eventCategory.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.checkpointId, table.categoryId],
      name: 'checkpoint_category_pk',
    }),
  ],
)
