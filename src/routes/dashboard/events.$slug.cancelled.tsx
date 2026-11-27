import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import {
  DataTable,
  type DataTableFeatures,
} from '~/components/data-table'
import { StatusBadge } from '~/components/status-badge'
import { formatIdr } from '~/data/events'
import { formatOrderDate } from '~/data/orders'
import {
  getEventBySlug,
  listCancelledEventParticipants,
  type CancelledEventParticipantRow,
} from '~/lib/event.functions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { buttonVariants } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'
import { DashboardTableSkeleton } from '~/components/page-skeletons'

const paymentStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  paid: 'bg-emerald-50 text-emerald-800',
  failed: 'bg-rose-50 text-rose-800',
  expired: 'bg-zinc-100 text-zinc-600',
}

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  expired: 'Expired',
}

const columnHelper = createColumnHelper<
  DataTableFeatures,
  CancelledEventParticipantRow
>()

export const Route = createFileRoute('/dashboard/events/$slug/cancelled')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event) throw notFound()
    const participants = await listCancelledEventParticipants({
      data: { slug: params.slug },
    })
    return { event, participants }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `Cancelled · ${loaderData.event.name} · Dashboard | Barong Cycling Team`,
          description: `Cancelled registrations for ${loaderData.event.name}.`,
        })
      : undefined,
  }),
  component: DashboardEventCancelledPage,
})

function cancelledColumns({
  eventSlug,
  isFlagship,
  isPaid,
}: {
  eventSlug: string
  isFlagship: boolean
  isPaid: boolean
}) {
  return columnHelper.columns([
    columnHelper.accessor('userName', {
      header: 'Name',
      cell: ({ row }) => (
        <span className="min-w-0">
          <span className="block font-medium">{row.original.userName}</span>
          <span className="mt-0.5 block truncate text-muted-foreground">
            {row.original.userEmail}
          </span>
        </span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Registered at',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {formatOrderDate(getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Cancelled at',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {formatOrderDate(getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('categoryName', {
      header: 'Category',
      cell: ({ getValue }) => getValue() ?? '—',
    }),
    ...(isFlagship
      ? [
          columnHelper.accessor('groupName', {
            header: 'Group',
            cell: ({ getValue }) => getValue() ?? '—',
          }),
          columnHelper.accessor('jerseySize', {
            header: 'Jersey',
            cell: ({ getValue }) => getValue() ?? '—',
          }),
        ]
      : []),
    ...(isPaid
      ? [
          columnHelper.display({
            id: 'total',
            header: 'Total',
            cell: ({ row }) =>
              formatIdr(row.original.price + row.original.donationAmount),
          }),
          columnHelper.accessor('paymentStatus', {
            header: 'Payment',
            cell: ({ getValue }) => {
              const status = getValue()
              if (!status) return '—'
              return (
                <StatusBadge
                  className={
                    paymentStatusStyles[status] ?? 'bg-zinc-100 text-zinc-600'
                  }
                >
                  {paymentStatusLabel[status] ?? status}
                </StatusBadge>
              )
            },
          }),
        ]
      : []),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          params={{ slug: eventSlug, participantId: row.original.id }}
          to="/dashboard/events/$slug/participants/$participantId"
        >
          Detail
        </Link>
      ),
    }),
  ])
}

function DashboardEventCancelledPage() {
  const { event, participants } = Route.useLoaderData()
  const isFlagship = event.kind === 'flagship'
  const isPaid = event.kind === 'paid' || isFlagship
  const [nameQuery, setNameQuery] = React.useState('')
  const columns = React.useMemo(
    () => cancelledColumns({ eventSlug: event.slug, isFlagship, isPaid }),
    [event.slug, isFlagship, isPaid],
  )
  const filtered = React.useMemo(() => {
    const query = nameQuery.trim().toLowerCase()
    if (!query) return participants
    return participants.filter((participant) =>
      participant.userName.toLowerCase().includes(query),
    )
  }, [participants, nameQuery])
  const hasFilter = nameQuery.trim().length > 0

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/dashboard/events" />}>
                  Events
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  render={
                    <Link
                      params={{ slug: event.slug }}
                      to="/dashboard/events/$slug"
                    />
                  }
                >
                  {event.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Cancelled</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Cancelled registrations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {participants.length}{' '}
              {participants.length === 1 ? 'registration' : 'registrations'} ·{' '}
              {event.name}. These rows stay in the database and no longer hold
              a spot.
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            params={{ slug: event.slug }}
            to="/dashboard/events/$slug"
          >
            Back to event
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            aria-label="Search by name"
            className="max-w-sm"
            onChange={(change) => setNameQuery(change.target.value)}
            placeholder="Search by name…"
            value={nameQuery}
          />
          <DataTable
            key={nameQuery}
            columns={columns}
            data={filtered}
            emptyMessage={
              hasFilter
                ? 'No matching registrations.'
                : 'No cancelled registrations for this event.'
            }
            getRowId={(row) => row.id}
            tableClassName="min-w-[40rem]"
          />
        </div>
      </div>
    </>
  )
}
