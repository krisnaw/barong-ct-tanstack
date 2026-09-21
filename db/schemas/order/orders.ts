import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user, userShippingAddress } from '../auth'
import { pickupPoint } from '../shop/pickup-point'

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
    pickupPointId: text('pickup_point_id').references(() => pickupPoint.id, {
      onDelete: 'set null',
    }),
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
    index('orders_pickup_point_id_idx').on(table.pickupPointId),
  ],
)
