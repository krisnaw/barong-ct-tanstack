/** DOKU Visa/MC/JCB credit card fee passed through to the customer. */
const CARD_PERCENT = 0.028
const CARD_FIXED = 2_000
const CARD_FIXED_TAX_RATE = 0.11

export function dokuCardServiceFee(amount: number) {
  if (amount <= 0) return 0
  const percentFee = Math.round(amount * CARD_PERCENT)
  const tax = Math.round(CARD_FIXED * CARD_FIXED_TAX_RATE)
  return percentFee + CARD_FIXED + tax
}

export function chargeAmountForMethod(
  goodsTotal: number,
  methodId: 'qris_va' | 'card',
) {
  if (methodId !== 'card') return goodsTotal
  return goodsTotal + dokuCardServiceFee(goodsTotal)
}
