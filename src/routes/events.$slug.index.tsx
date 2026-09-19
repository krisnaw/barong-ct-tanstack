import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { EventDetail } from '~/components/event-detail'

export const Route = createFileRoute('/events/$slug/')({
  component: EventDetailPage,
})

function EventDetailPage() {
  const { event, myRegistration } = useLoaderData({ from: '/events/$slug' })
  return <EventDetail event={event} registration={myRegistration} />
}
