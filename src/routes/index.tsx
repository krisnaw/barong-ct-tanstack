import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '~/components/hero'
import { PastEvents } from '~/components/past-events'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <Hero />
      <PastEvents />
    </main>
  )
}
