import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { getPastEvent } from '~/data/events'

export const Route = createFileRoute('/events/$slug')({
  loader: ({ params }) => {
    const event = getPastEvent(params.slug)
    if (!event) {
      throw notFound()
    }
    return event
  },
  component: EventDetailPlaceholder,
})

function EventDetailPlaceholder() {
  const event = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
        Event recap
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
        {event.name}
      </h1>
      <p className="mt-4 text-muted-foreground">
        Full recap is coming soon. {event.date} · {event.location}
      </p>
      <Link
        className="mt-8 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        to="/"
      >
        Back to home
      </Link>
    </main>
  )
}
