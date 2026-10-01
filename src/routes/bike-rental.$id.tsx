import { createFileRoute, notFound } from '@tanstack/react-router'
import { BikeRentalDetail } from '~/components/bike-rental-detail'
import { findRentalBike } from '~/data/bike-rental'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/bike-rental/$id')({
  loader: ({ params }) => {
    const bike = findRentalBike(params.id)
    if (!bike) throw notFound()
    return bike
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} Rental | Barong Cycling Team`,
          description: loaderData.summary,
          image: loaderData.image,
        })
      : undefined,
  }),
  component: BikeRentalDetailRoute,
})

function BikeRentalDetailRoute() {
  const bike = Route.useLoaderData()
  return <BikeRentalDetail bike={bike} />
}
