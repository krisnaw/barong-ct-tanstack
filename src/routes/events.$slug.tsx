import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { eventImageSrc } from '~/data/events'
import {
  getEventBySlug,
  getMyEventRegistration,
} from '~/lib/event.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/events/$slug')({
  loader: async ({ params }) => {
    const [event, myRegistration] = await Promise.all([
      getEventBySlug({ data: { slug: params.slug } }),
      getMyEventRegistration({ data: { slug: params.slug } }),
    ])
    if (!event) {
      throw notFound()
    }
    return { event, myRegistration }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.event.name} | Barong Cycling Team`,
          description: loaderData.event.blurb,
          image: eventImageSrc(loaderData.event.image, 1200),
        })
      : undefined,
  }),
  component: EventSlugLayout,
})

function EventSlugLayout() {
  return <Outlet />
}
