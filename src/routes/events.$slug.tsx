import { createFileRoute, notFound } from '@tanstack/react-router'
import { EventRecap } from '~/components/event-recap'
import { getPastEvent } from '~/data/events'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/events/$slug')({
  loader: ({ params }) => {
    const event = getPastEvent(params.slug)
    if (!event) {
      throw notFound()
    }
    return event
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} | Barong Cycling Team`,
          description: loaderData.summary,
          image: `${loaderData.image}&w=1200&q=80`,
        })
      : undefined,
  }),
  component: EventDetailPage,
})

function EventDetailPage() {
  const event = Route.useLoaderData()
  return (
    <main>
      <EventRecap event={event} />
    </main>
  )
}
