import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user, userShippingAddress } from '~/lib/auth-schema'
import { product } from '~/lib/shop-schema'

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    number: text('number').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'no action' }),
    email: text('email').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone').notNull(),
    address: text('address').notNull(),
    apartment: text('apartment'),
    city: text('city').notNull(),
    province: text('province').notNull(),
    postal: text('postal').notNull(),
    shippingAddressId: text('shipping_address_id').references(
      () => userShippingAddress.id,
      { onDelete: 'set null' },
    ),
    shippingSpeed: text('shipping_speed').notNull(),
    shippingLabel: text('shipping_label').notNull(),
    subtotal: integer('subtotal').notNull(),
    shipping: integer('shipping').notNull(),
    discount: integer('discount').default(0).notNull(),
    total: integer('total').notNull(),
    discountCode: text('discount_code'),
    status: text('status').default('pending').notNull(),
    courier: text('courier'),
    trackingNumber: text('tracking_number'),
    placedAt: integer('placed_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('orders_userId_idx').on(table.userId),
    index('orders_placed_at_idx').on(table.placedAt),
  ],
)

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

export const payment = sqliteTable(
  'payment',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    transactionId: text('transaction_id').notNull(),
    status: text('status').default('pending').notNull(),
    method: text('method'),
    amount: integer('amount').notNull(),
    payload: text('payload'),
    paidAt: integer('paid_at', { mode: 'timestamp_ms' }),
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
    uniqueIndex('payment_provider_transaction_uidx').on(
      table.provider,
      table.transactionId,
    ),
  ],
)

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  shippingAddress: one(userShippingAddress, {
    fields: [orders.shippingAddressId],
    references: [userShippingAddress.id],
  }),
  lines: many(lineItems),
  payments: many(payment),
}))

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  order: one(orders, {
    fields: [lineItems.orderId],
    references: [orders.id],
  }),
  product: one(product, {
    fields: [lineItems.productId],
    references: [product.id],
  }),
}))

export const paymentRelations = relations(payment, ({ one }) => ({
  order: one(orders, {
    fields: [payment.orderId],
    references: [orders.id],
  }),
}))
