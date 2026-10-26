import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/staff/rpc')({
  component: StaffRpcLayout,
})

function StaffRpcLayout() {
  return <Outlet />
}
