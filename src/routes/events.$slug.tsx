import { createFileRoute, notFound } from '@tanstack/react-router'
import { EventDetail } from '~/components/event-detail'
import { getEvent } from '~/data/events'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/events/$slug')({
  loader: ({ params }) => {
    const event = getEvent(params.slug)
    if (!event) {
      throw notFound()
    }
    return event
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} | Barong Cycling Team`,
          description: loaderData.blurb,
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
      <EventDetail event={event} />
    </main>
  )
}
