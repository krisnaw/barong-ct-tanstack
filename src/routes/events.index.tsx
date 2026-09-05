import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { EventsList, type EventsTab } from '~/components/events-list'
import { seo } from '~/utils/seo'

const eventsSearchSchema = z.object({
  tab: z.enum(['active', 'past']).optional().catch('active'),
})

export const Route = createFileRoute('/events/')({
  validateSearch: eventsSearchSchema,
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
  const { tab } = Route.useSearch()
  return <EventsList tab={(tab ?? 'active') as EventsTab} />
}
