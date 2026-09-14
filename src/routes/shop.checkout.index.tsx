import { createFileRoute } from '@tanstack/react-router'
import { ShopCheckout } from '~/components/shop-checkout'
import { getPaymentDisplay } from '~/lib/payment.functions'
import { listPickupPoints } from '~/lib/pickup-point.functions'
import { seo } from '~/utils/seo'
import { Route as ShopRoute } from './shop'

export const Route = createFileRoute('/shop/checkout/')({
  loader: async () => ({
    paymentDisplay: await getPaymentDisplay(),
    pickupPoints: await listPickupPoints(),
  }),
  head: () => ({
    meta: seo({
      title: 'Checkout | Barong Cycling Team',
      description: 'Complete your Barong kit order — collect at a pickup point.',
    }),
  }),
  component: ShopCheckoutPage,
})

function ShopCheckoutPage() {
  const products = ShopRoute.useLoaderData()
  const { paymentDisplay, pickupPoints } = Route.useLoaderData()
  return (
    <ShopCheckout
      paymentDisplay={paymentDisplay}
      pickupPoints={pickupPoints}
      products={products}
    />
  )
}
