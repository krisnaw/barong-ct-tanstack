import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { CheckoutAwaitingPayment } from '~/components/shop-checkout'
import { getOrderById } from '~/lib/order.functions'
import { seo } from '~/utils/seo'

const searchSchema = z.object({
  order: z.string().min(1),
})

export const Route = createFileRoute('/shop/checkout/cancel')({
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
