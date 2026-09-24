import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { PackageIcon } from '@phosphor-icons/react'
import { getSession, hasStaffAccess } from '~/lib/auth.functions'
import { seo } from '~/utils/seo'
import { cn } from '~/lib/utils'
import { buttonVariants } from '~/components/ui/button'

export const Route = createFileRoute('/staff')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/auth/login' })
    }
    if (!session.user.emailVerified) {
      throw redirect({ to: '/account' })
    }
    if (!hasStaffAccess(session.user.role)) {
      throw redirect({ to: '/' })
    }
    return { user: session.user }
  },
  head: () => ({
    meta: seo({
      title: 'Staff | Barong Cycling Team',
      description: 'Staff tools for Barong Cycling Team.',
    }),
  }),
  component: StaffLayout,
})

function StaffLayout() {
  const { user } = Route.useRouteContext()

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link
            className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            to="/staff"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageIcon className="size-4" weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-tight">
                Staff desk
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.name}
              </p>
            </div>
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            to="/account"
          >
            Account
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
