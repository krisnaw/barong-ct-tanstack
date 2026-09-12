import { createFileRoute } from '@tanstack/react-router'
import { ShopCheckout } from '~/components/shop-checkout'
import { getPaymentDisplay } from '~/lib/payment.functions'
import { seo } from '~/utils/seo'
import { Route as ShopRoute } from './shop'

export const Route = createFileRoute('/shop/checkout/')({
  loader: async () => ({
    paymentDisplay: await getPaymentDisplay(),
  }),
  head: () => ({
    meta: seo({
      title: 'Checkout | Barong Cycling Team',
      description: 'Complete your Barong kit order — ship within Indonesia.',
    }),
  }),
  component: ShopCheckoutPage,
})

function ShopCheckoutPage() {
  const products = ShopRoute.useLoaderData()
  const { paymentDisplay } = Route.useLoaderData()
  return <ShopCheckout paymentDisplay={paymentDisplay} products={products} />
}
