import { createFileRoute, notFound } from '@tanstack/react-router'
import { BikeRentalDetail } from '~/components/bike-rental-detail'
import { findRentalBike, rentalLocationSearchSchema } from '~/data/bike-rental'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/bike-rental/$id')({
  validateSearch: rentalLocationSearchSchema,
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
  const { location } = Route.useSearch()
  return <BikeRentalDetail bike={bike} locationId={location} />
}
