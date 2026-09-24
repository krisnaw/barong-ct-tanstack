import { Link, createFileRoute } from '@tanstack/react-router'
import { CaretRightIcon, PackageIcon } from '@phosphor-icons/react'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/staff/')({
  head: () => ({
    meta: seo({
      title: 'Staff | Barong Cycling Team',
      description: 'Staff tools for Barong Cycling Team.',
    }),
  }),
  component: StaffIndexPage,
})

function StaffIndexPage() {
  return (
    <ul className="flex flex-col gap-3">
      <li>
        <Link
          className="flex items-start gap-3 border border-border px-4 py-4 transition-colors hover:bg-muted/50"
          to="/staff/pickup"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackageIcon className="size-5" weight="bold" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-medium tracking-tight">Manage order</p>
            <p className="text-sm text-muted-foreground">
              Hand out paid kit at the pickup point.
            </p>
          </div>
          <CaretRightIcon
            aria-hidden
            className="mt-1 size-4 shrink-0 text-muted-foreground"
          />
        </Link>
      </li>
    </ul>
  )
}
