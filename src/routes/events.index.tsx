import { createFileRoute } from '@tanstack/react-router'
import { EventsList } from '~/components/events-list'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/events/')({
  head: () => ({
    meta: seo({
      title: 'Events | Barong Cycling Team',
      description:
        'Barong Melali and past club rides — jalan-jalan across Bali, not races.',
    }),
  }),
  component: EventsPage,
})

function EventsPage() {
  return <EventsList />
}
