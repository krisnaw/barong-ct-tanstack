import { relations } from 'drizzle-orm'
import { orders } from '../order/orders'
import { product } from './product'
import { productSize } from './product-size'
import { shopPromo } from './promo'

export const productRelations = relations(product, ({ many }) => ({
  sizes: many(productSize),
}))

export const productSizeRelations = relations(productSize, ({ one }) => ({
  product: one(product, {
    fields: [productSize.productId],
    references: [product.id],
  }),
}))

export const shopPromoRelations = relations(shopPromo, ({ many }) => ({
  orders: many(orders),
}))
