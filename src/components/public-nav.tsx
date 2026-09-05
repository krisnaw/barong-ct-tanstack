import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '~/lib/utils'

export function PublicNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const onEvents = pathname === '/events' || pathname.startsWith('/events/')

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-12">
        <Link
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          to="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-foreground font-heading text-sm font-semibold tracking-tight text-background">
            B
          </span>
          <span className="font-heading text-sm font-medium tracking-wide uppercase">
            Barong
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-7 text-sm">
          <Link
            className={cn(
              'text-muted-foreground transition-colors hover:text-foreground',
              onEvents && 'font-medium text-foreground',
            )}
            to="/events"
          >
            Events
          </Link>
        </nav>
      </div>
    </header>
  )
}
