import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  CheckoutAwaitingPayment,
  CheckoutConfirmation,
} from '~/components/shop-checkout'
import { orderPaymentStatus } from '~/data/orders'
import { getOrderById } from '~/lib/order.functions'
import { checkoutOrderSearch } from '~/lib/payment/order-search'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/checkout/return')({
  validateSearch: checkoutOrderSearch,
  loaderDeps: ({ search }) => ({ order: search.order }),
  loader: async ({ deps }) => {
    if (!deps.order) {
      throw redirect({ to: '/account/orders' })
    }
    const order = await getOrderById({ data: { id: deps.order } })
    if (!order) throw redirect({ to: '/account/orders' })
    return { order }
  },
  head: ({ loaderData }) => ({
    meta: seo({
      title: `${loaderData?.order.id ?? 'Order'} | Checkout | Barong Cycling Team`,
      description: 'Your Barong kit payment result.',
    }),
  }),
  component: CheckoutReturnPage,
})

function CheckoutReturnPage() {
  const { order } = Route.useLoaderData()
  if (orderPaymentStatus(order) === 'paid') {
    return <CheckoutConfirmation order={order} />
  }
  return (
    <CheckoutAwaitingPayment
      detail="Payment is not confirmed yet. If you already paid, wait a moment and refresh, or try again."
      order={order}
      title="Waiting for payment"
    />
  )
}
