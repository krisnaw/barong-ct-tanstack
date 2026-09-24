import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from '../auth'
import { event } from '../event/event'

export const financeExpense = sqliteTable(
  'finance_expense',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    category: text('category').notNull(),
    eventId: text('event_id').references(() => event.id, {
      onDelete: 'set null',
    }),
    note: text('note').default('').notNull(),
    amount: integer('amount').notNull(),
    currency: text('currency').default('IDR').notNull(),
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('finance_expense_date_idx').on(table.date),
    index('finance_expense_category_idx').on(table.category),
    index('finance_expense_event_id_idx').on(table.eventId),
  ],
)
