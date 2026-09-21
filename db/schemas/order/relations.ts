import { relations } from 'drizzle-orm'
import { user, userShippingAddress } from '../auth'
import { eventParticipant } from '../event/participant'
import { pickupPoint } from '../shop/pickup-point'
import { product } from '../shop/product'
import { lineItems } from './line-items'
import { orders } from './orders'
import { payment } from './payment'

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  shippingAddress: one(userShippingAddress, {
    fields: [orders.shippingAddressId],
    references: [userShippingAddress.id],
  }),
  pickupPoint: one(pickupPoint, {
    fields: [orders.pickupPointId],
    references: [pickupPoint.id],
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
  participant: one(eventParticipant, {
    fields: [payment.participantId],
    references: [eventParticipant.id],
  }),
}))
