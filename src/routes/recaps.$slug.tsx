import { createFileRoute, notFound } from '@tanstack/react-router'
import { EventRecap } from '~/components/event-recap'
import { getRecap } from '~/data/recaps'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/recaps/$slug')({
  loader: ({ params }) => {
    const recap = getRecap(params.slug)
    if (!recap) {
      throw notFound()
    }
    return recap
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} Recap | Barong Cycling Team`,
          description: loaderData.summary,
          image: `${loaderData.image}&w=1200&q=80`,
        })
      : undefined,
  }),
  component: RecapPage,
})

function RecapPage() {
  const recap = Route.useLoaderData()
  return (
    <main>
      <EventRecap event={recap} />
    </main>
  )
}
