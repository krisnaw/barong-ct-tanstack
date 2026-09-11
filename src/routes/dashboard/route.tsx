import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppSidebar } from '~/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { getSession, hasAdminRole } from '~/lib/auth.functions'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/auth/login' })
    }
    if (!session.user.emailVerified) {
      throw redirect({ to: '/account' })
    }
    if (!hasAdminRole(session.user.role)) {
      throw redirect({ to: '/' })
    }
    return { user: session.user }
  },
  head: () => ({
    meta: seo({
      title: 'Dashboard | Barong Cycling Team',
      description: 'Barong Cycling Team admin dashboard.',
    }),
  }),
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user } = Route.useRouteContext()

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
