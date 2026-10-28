import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import { accountDisplayName, useAccount } from '~/lib/account'
import { AccountPageSkeleton } from '~/components/page-skeletons'
import { cn } from '~/lib/utils'

const sections = [
  { to: '/account', label: 'Profile', exact: true },
  { to: '/account/address', label: 'Shipping Address', exact: false },
  { to: '/account/orders', label: 'Orders', exact: false },
] as const

export function AccountLayout() {
  const { profile, signedIn, ready, signOut } = useAccount()

  if (!ready) {
    return <AccountPageSkeleton />
  }

  if (!signedIn || !profile) {
    return (
      <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage kit size, delivery details, and orders.
        </p>
        <Link className={cn(buttonVariants(), 'mt-6')} to="/auth/login">
          Sign in
        </Link>
      </section>
    )
  }

  return (
    <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
      <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10 sm:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Account
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {profile.firstName.trim()
              ? accountDisplayName(profile)
              : 'Your account'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <button
          className="shrink-0 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:pt-0"
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,52rem)] lg:items-start lg:gap-12 xl:gap-16">
        <AccountSectionNav />
        <div>
          <Outlet />
        </div>
      </div>
    </section>
  )
}

function AccountSectionNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <>
      <nav
        aria-label="Account sections"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-border lg:hidden"
        role="tablist"
      >
        {sections.map((section) => {
          const active = isSectionActive(pathname, section)
          return (
            <Link
              aria-selected={active}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              key={section.to}
              role="tab"
              to={section.to}
            >
              {section.label}
            </Link>
          )
        })}
      </nav>

      <nav
        aria-label="Account sections"
        className="hidden lg:sticky lg:top-6 lg:flex lg:flex-col"
      >
        {sections.map((section) => {
          const active = isSectionActive(pathname, section)
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'border-l-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground',
              )}
              key={section.to}
              to={section.to}
            >
              {section.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

function isSectionActive(
  pathname: string,
  section: (typeof sections)[number],
) {
  if (section.exact) {
    return pathname === '/account' || pathname === '/account/'
  }
  return pathname === section.to || pathname.startsWith(`${section.to}/`)
}
