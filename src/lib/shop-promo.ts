import { eq } from 'drizzle-orm'
import { db } from 'db'
import { shopPromo } from 'db/schemas/shop'
import { discountAmount } from '~/data/orders'

export async function resolveShopDiscount(
  code: string | undefined,
  subtotal: number,
) {
  const normalized = code?.trim().toUpperCase() ?? ''
  if (!normalized) return null

  const promo = await db.query.shopPromo.findFirst({
    where: eq(shopPromo.code, normalized),
  })
  if (!promo) throw new Error('Invalid promo code')
  if (!promo.isActive) throw new Error('This promo code is not active')
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    throw new Error('This promo code has reached its usage limit')
  }

  const type = promo.discountType === 'percent' ? 'percent' : 'fixed'
  const amount = discountAmount(subtotal, {
    type,
    value: promo.discountValue,
  })
  if (amount <= 0) {
    throw new Error('This promo code does not apply to this order')
  }

  return {
    promoId: promo.id,
    code: promo.code,
    type,
    value: promo.discountValue,
    amount,
  }
}
