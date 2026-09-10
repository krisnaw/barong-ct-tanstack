import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { PastEvents } from '~/components/past-events'
import { WeeklyRides } from '~/components/weekly-rides'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <Hero />
      <WeeklyRides />
      <PastEvents />
    </main>
  )
}
