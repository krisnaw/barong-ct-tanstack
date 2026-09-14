import { createFileRoute, redirect } from '@tanstack/react-router'
import { CheckoutAwaitingPayment } from '~/components/shop-checkout'
import { getOrderById } from '~/lib/order.functions'
import { checkoutOrderSearch } from '~/lib/payment/order-search'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/shop/checkout/cancel')({
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
      description: 'Payment was cancelled for this Barong kit order.',
    }),
  }),
  component: CheckoutCancelPage,
})

function CheckoutCancelPage() {
  const { order } = Route.useLoaderData()
  return (
    <CheckoutAwaitingPayment
      detail="No payment was taken. You can pay now to complete this order."
      order={order}
      title="Payment cancelled"
    />
  )
}
