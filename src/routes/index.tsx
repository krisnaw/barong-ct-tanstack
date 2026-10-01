import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { WeeklyRides } from '~/components/weekly-rides'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: seo({
      title: 'Barong Cycling Team | Group Road & Gravel Rides in Bali',
      description:
        "Bali's largest road and gravel cycling community, riding from Denpasar since 2016. Join our group rides every Tuesday, Thursday and Saturday at 6:15 AM.",
    }),
  }),
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
