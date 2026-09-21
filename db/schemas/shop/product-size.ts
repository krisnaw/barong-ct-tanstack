import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { product } from './product'

export const productSize = sqliteTable(
  'product_size',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    size: text('size').notNull(),
    stock: integer('stock').default(0).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('product_size_product_size_uidx').on(table.productId, table.size),
    index('product_size_productId_idx').on(table.productId),
  ],
)
