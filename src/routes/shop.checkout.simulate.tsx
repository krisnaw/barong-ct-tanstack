import * as React from 'react'
import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { formatShopPrice } from '~/data/shop'
import { getOrderById } from '~/lib/order.functions'
import { getPaymentDisplay, simulateStubPayment } from '~/lib/payment.functions'
import { seo } from '~/utils/seo'

const searchSchema = z.object({
  order: z.string().min(1),
})

export const Route = createFileRoute('/shop/checkout/simulate')({
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const display = await getPaymentDisplay()
    if (display.name !== 'stub') throw notFound()
    const parsed = searchSchema.safeParse(location.search)
    if (!parsed.success) throw notFound()
    const order = await getOrderById({ data: { id: parsed.data.order } })
    if (!order) throw notFound()
    return { order }
  },
  head: () => ({
    meta: seo({
      title: 'Simulate payment | Barong Cycling Team',
      description: 'Test payment page for unpaid Barong kit orders.',
    }),
  }),
  component: CheckoutSimulatePage,
})

function CheckoutSimulatePage() {
  const { order } = Route.useLoaderData()
  const navigate = useNavigate()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  async function markPaid() {
    setPending(true)
    setError('')
    try {
      await simulateStubPayment({ data: { orderNumber: order.id } })
      await navigate({
        to: '/shop/checkout/return',
        search: { order: order.id },
      })
    } catch (caught) {
      setPending(false)
      setError(
        caught instanceof Error ? caught.message : 'Could not simulate payment',
      )
    }
  }

  return (
    <div className="min-h-dvh bg-background px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
      <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
        Test payment
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
        Simulate payment
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Order {order.id} · {formatShopPrice(order.total)}. This page is only
        available while PAYMENT_PROVIDER is stub.
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button disabled={pending} onClick={() => void markPaid()} size="lg">
          {pending ? (<><Spinner /> Confirming…</>) : 'Mark paid'}
        </Button>
        <Link
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          search={{ order: order.id }}
          to="/shop/checkout/cancel"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
