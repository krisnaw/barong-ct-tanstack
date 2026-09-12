import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import {
  CheckoutAwaitingPayment,
  CheckoutConfirmation,
} from '~/components/shop-checkout'
import { orderPaymentStatus } from '~/data/orders'
import { getOrderById } from '~/lib/order.functions'
import { seo } from '~/utils/seo'

const searchSchema = z.object({
  order: z.string().min(1),
})

export const Route = createFileRoute('/shop/checkout/return')({
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const parsed = searchSchema.safeParse(location.search)
    if (!parsed.success) throw notFound()
    const order = await getOrderById({ data: { id: parsed.data.order } })
    if (!order) throw notFound()
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
