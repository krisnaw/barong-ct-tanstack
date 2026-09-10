import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-foreground text-white">
      <div className="flex flex-col items-center gap-5 px-5 py-10 text-center sm:px-8 lg:px-12 lg:py-12">
        <p className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-full bg-white font-heading text-xs font-semibold text-foreground">
            B
          </span>
          <span className="font-heading text-sm font-medium tracking-wide uppercase">
            Barong Cycling Team
          </span>
        </p>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
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
          <Link
            className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/50"
            to="/shop"
          >
            Shop
          </Link>
          <Link
            className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/50"
            to="/account"
          >
            Account
          </Link>
          <a
            className="rounded-sm outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/50"
            href="https://www.strava.com/clubs/barongcyclingteam"
            rel="noopener noreferrer"
            target="_blank"
          >
            Strava
          </a>
        </nav>
      </div>
    </footer>
  )
}
