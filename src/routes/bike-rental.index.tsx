import { createFileRoute } from '@tanstack/react-router'
import { BikeRentalPage } from '~/components/bike-rental-page'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/bike-rental/')({
  head: () => ({
    meta: seo({
      title: 'Club Bike Rental | Barong Cycling Team',
      description:
        'Borrow a Barong Cycling Team road, gravel, or mountain bike for a guest ride or a few days in Bali. Preview the fleet and leave a rental request.',
    }),
  }),
  component: BikeRentalIndex,
})

function BikeRentalIndex() {
  return <BikeRentalPage />
}
