import { Link } from '@tanstack/react-router'

export function AuthBrandLink() {
  return (
    <Link to="/" className="flex flex-col items-center gap-2 font-medium">
      <img
        alt="Barong Cycling Team"
        className="h-12 w-auto"
        height={48}
        src="/barong-no-bg.png"
        width={37}
      />
      <span className="sr-only">Barong Cycling Team</span>
    </Link>
  )
}
