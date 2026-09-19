import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { EventsList, type EventsTab } from '~/components/events-list'
import { listEvents } from '~/lib/event.functions'
import { seo } from '~/utils/seo'
import { EventsListSkeleton } from '~/components/page-skeletons'

const eventsSearchSchema = z.object({
  tab: z.enum(['active', 'past']).optional().catch('active'),
})

export const Route = createFileRoute('/events/')({
  pendingComponent: EventsListSkeleton,
  pendingMs: 150,
  validateSearch: eventsSearchSchema,
  loader: () => listEvents({ data: { status: 'open' } }),
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
  const events = Route.useLoaderData()
  return <EventsList events={events} tab={(tab ?? 'active') as EventsTab} />
}
