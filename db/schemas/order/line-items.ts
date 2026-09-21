import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { product } from '../shop/product'
import { orders } from './orders'

export const lineItems = sqliteTable(
  'line_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => product.id, {
      onDelete: 'set null',
    }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    size: text('size').notNull(),
    quantity: integer('quantity').notNull(),
    price: integer('price').notNull(),
    image: text('image').notNull(),
    preOrder: integer('pre_order', { mode: 'boolean' }).default(false).notNull(),
    custom: text('custom'),
  },
  (table) => [index('line_items_orderId_idx').on(table.orderId)],
)
