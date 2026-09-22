import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { WeeklyRides } from '~/components/weekly-rides'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <Hero />
      <WeeklyRides />
    </main>
  )
}
