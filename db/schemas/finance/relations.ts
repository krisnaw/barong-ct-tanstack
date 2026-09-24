import { relations } from 'drizzle-orm'
import { user } from '../auth'
import { event } from '../event/event'
import { financeExpense } from './expense'
import { financeIncome } from './income'

export const financeIncomeRelations = relations(financeIncome, ({ one }) => ({
  event: one(event, {
    fields: [financeIncome.eventId],
    references: [event.id],
  }),
  createdByUser: one(user, {
    fields: [financeIncome.createdBy],
    references: [user.id],
  }),
}))

export const financeExpenseRelations = relations(financeExpense, ({ one }) => ({
  event: one(event, {
    fields: [financeExpense.eventId],
    references: [event.id],
  }),
  createdByUser: one(user, {
    fields: [financeExpense.createdBy],
    references: [user.id],
  }),
}))
