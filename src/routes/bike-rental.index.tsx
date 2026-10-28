import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BikeRentalPage } from '~/components/bike-rental-page'
import { rentalLocationSearchSchema } from '~/data/bike-rental'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/bike-rental/')({
  validateSearch: rentalLocationSearchSchema,
  head: () => ({
    meta: seo({
      title: 'Club Bike Rental | Barong Cycling Team',
      description:
        'Borrow a Barong Cycling Team bike in Canggu, Denpasar, Ubud, or Buleleng. Preview the fleet stationed where you are staying and leave a rental request.',
    }),
  }),
  component: BikeRentalIndex,
})

function BikeRentalIndex() {
  const { location } = Route.useSearch()
  const navigate = useNavigate({ from: '/bike-rental/' })

  return (
    <BikeRentalPage
      locationId={location}
      onLocationChange={(next) => {
        navigate({ search: { location: next } })
      }}
    />
  )
}
