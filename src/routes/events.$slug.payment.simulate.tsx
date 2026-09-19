import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { z } from 'zod'
import { formatIdr } from '~/data/events'
import { getEventBySlug } from '~/lib/event.functions'
import {
  getPaymentDisplay,
  simulateStubEventPayment,
} from '~/lib/payment.functions'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { seo } from '~/utils/seo'

const searchSchema = z.object({
  participant: z.string().min(1),
})

export const Route = createFileRoute('/events/$slug/payment/simulate')({
  validateSearch: searchSchema,
  loader: async ({ params, location }) => {
    const display = await getPaymentDisplay()
    if (display.name !== 'stub') throw notFound()
    const event = await getEventBySlug({ data: { slug: params.slug } })
    if (!event) throw notFound()
    const parsed = searchSchema.safeParse(location.search)
    if (!parsed.success) throw notFound()
    return { event, participantId: parsed.data.participant }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `Simulate payment · ${loaderData.event.name} | Barong Cycling Team`,
          description: 'Test payment page for event registration.',
        })
      : undefined,
  }),
  component: EventPaymentSimulatePage,
})

function EventPaymentSimulatePage() {
  const { event, participantId } = Route.useLoaderData()
  const navigate = useNavigate()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  async function markPaid() {
    setPending(true)
    setError('')
    try {
      await simulateStubEventPayment({ data: { participantId } })
      await navigate({
        to: '/events/$slug',
        params: { slug: event.slug },
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
        {event.name}
        {event.feeAmount != null ? ` · ${formatIdr(event.feeAmount)}` : ''}.
        This page is only available while PAYMENT_PROVIDER is stub.
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button disabled={pending} onClick={() => void markPaid()} size="lg">
          {pending ? (<><Spinner /> Confirming…</>) : 'Mark paid'}
        </Button>
        <Link
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          params={{ slug: event.slug }}
          search={{ step: 'payment' }}
          to="/events/$slug/register"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
