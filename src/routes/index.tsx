import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { PastEvents } from '~/components/past-events'
import { WeeklyRides } from '~/components/weekly-rides'
import { listEvents } from '~/lib/event.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const events = await listEvents({ data: { status: 'closed' } })
    return [...events].sort((a, b) =>
      (b.eventDate ?? '').localeCompare(a.eventDate ?? ''),
    )
  },
  component: Home,
})

function Home() {
  const events = Route.useLoaderData()

  return (
    <main>
      <Hero />
      <WeeklyRides />
      <PastEvents events={events} />
    </main>
  )
}
