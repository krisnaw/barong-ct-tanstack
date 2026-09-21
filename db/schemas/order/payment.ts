import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { eventParticipant } from '../event/participant'
import { orders } from './orders'

export const payment = sqliteTable(
  'payment',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    participantId: text('participant_id').references(() => eventParticipant.id, {
      onDelete: 'cascade',
    }),
    provider: text('provider').notNull(),
    transactionId: text('transaction_id').notNull(),
    status: text('status').default('pending').notNull(),
    method: text('method'),
    amount: integer('amount').notNull(),
    currency: text('currency').default('IDR').notNull(),
    checkoutUrl: text('checkout_url'),
    paidAt: integer('paid_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('payment_orderId_idx').on(table.orderId),
    index('payment_participantId_idx').on(table.participantId),
    uniqueIndex('payment_provider_transaction_uidx').on(
      table.provider,
      table.transactionId,
    ),
  ],
)
