import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/bike-rental')({
  component: BikeRentalLayout,
})

function BikeRentalLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
