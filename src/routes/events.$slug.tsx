import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import { getEventBySlug } from '~/lib/event.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/events/$slug')({
  loader: async ({ params }) => {
    const event = await getEventBySlug({ data: { slug: params.slug } })
    if (!event) {
      throw notFound()
    }
    return event
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} | Barong Cycling Team`,
          description: loaderData.blurb,
          image: `${loaderData.image}&w=1200&q=80`,
        })
      : undefined,
  }),
  component: EventSlugLayout,
})

function EventSlugLayout() {
  return <Outlet />
}
