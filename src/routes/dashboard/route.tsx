import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '~/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: seo({
      title: 'Dashboard | Barong Cycling Team',
      description: 'Barong Cycling Team admin dashboard.',
    }),
  }),
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
