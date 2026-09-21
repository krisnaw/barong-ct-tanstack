import { relations } from 'drizzle-orm'
import { product } from './product'
import { productSize } from './product-size'

export const productRelations = relations(product, ({ many }) => ({
  sizes: many(productSize),
}))

export const productSizeRelations = relations(productSize, ({ one }) => ({
  product: one(product, {
    fields: [productSize.productId],
    references: [product.id],
  }),
}))
