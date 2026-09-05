import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-foreground text-white">
      <div className="flex flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-12">
        <div>
          <p className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-white font-heading text-xs font-semibold text-foreground">
              B
            </span>
            <span className="font-heading text-sm font-medium tracking-wide uppercase">
              Barong Cycling Team
            </span>
          </p>
          <p className="mt-3 text-sm text-white/60">Denpasar, Bali · Est. 2016</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <nav aria-label="Footer" className="flex gap-6 text-sm text-white/70">
            <Link
              className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/50"
              hash="rides"
              to="/"
            >
              Rides
            </Link>
            <Link
              className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/50"
              to="/events"
            >
              Events
            </Link>
          </nav>
          <p className="text-sm text-white/45">© 2026 Barong Cycling Team</p>
        </div>
      </div>
    </footer>
  )
}
