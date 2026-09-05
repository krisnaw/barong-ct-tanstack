import { Link, createFileRoute } from '@tanstack/react-router'
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
  return (
    <main>
      <header className="flex items-center justify-between gap-6 border-b border-border px-5 py-5 sm:px-8 lg:px-12">
        <Link
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold tracking-tight text-background">
            B
          </span>
          <span className="font-heading text-sm font-medium tracking-wide uppercase">
            Barong
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="flex items-center gap-6 text-sm text-muted-foreground"
        >
          <Link className="transition-colors hover:text-foreground" to="/">
            Home
          </Link>
          <Link className="font-medium text-foreground" to="/events">
            Events
          </Link>
        </nav>
      </header>
      <EventsList />
    </main>
  )
}
