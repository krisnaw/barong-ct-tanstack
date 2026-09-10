import { createFileRoute } from '@tanstack/react-router'
import { ShopCheckout } from '~/components/shop-checkout'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/checkout')({
  head: () => ({
    meta: seo({
      title: 'Checkout | Barong Cycling Team',
      description: 'Complete your Barong kit order — pickup or delivery.',
    }),
  }),
  component: ShopCheckoutPage,
})

function ShopCheckoutPage() {
  return <ShopCheckout />
}
