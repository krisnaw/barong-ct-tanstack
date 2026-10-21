import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { formatIdr } from '~/data/events'
import { CategoryFormDialog } from '~/routes/dashboard/events.$slug.categories'
import {
  getEventBySlug,
  listEventParticipants,
  type EventParticipantRow,
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
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'
import { DashboardDetailSkeleton } from '~/components/page-skeletons'
import { EventQrDialog } from '~/components/event-qr-dialog'
import { EventStatusBadge } from '~/components/event-status-badge'
import {
  TABLE_PAGE_SIZE,
  TablePagination,
} from '~/components/table-pagination'

const participantStatusStyles: Record<string, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  pending_payment: 'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-800',
}

const participantStatusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

export const Route = createFileRoute('/dashboard/events/$slug/')({
  pendingComponent: DashboardDetailSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event) {
      throw notFound()
    }
    const participants = await listEventParticipants({
      data: { slug: params.slug },
    })
    return { event, participants }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.event.name} · Dashboard | Barong Cycling Team`,
          description: loaderData.event.blurb,
        })
      : undefined,
  }),
  component: DashboardEventDetailPage,
})

function DashboardEventDetailPage() {
  const { event, participants } = Route.useLoaderData()
  const isFlagship = event.kind === 'flagship'
  const isPaid = event.kind === 'paid' || isFlagship
  const confirmedParticipants = participants.filter(isPaidParticipant)
  const paidParticipants = confirmedParticipants.length
  const entryFeeTotal = confirmedParticipants.reduce(
    (sum, participant) => sum + participant.price,
    0,
  )
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageCount = Math.max(1, Math.ceil(participants.length / TABLE_PAGE_SIZE))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const pageParticipants = participants.slice(
    safePageIndex * TABLE_PAGE_SIZE,
    safePageIndex * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE,
  )

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
              <BreadcrumbItem>
                <BreadcrumbPage>{event.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={event.status} />
            <span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {event.kind}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <EventQrDialog name={event.name} slug={event.slug} />
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/edit"
            >
              Edit
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/categories"
            >
              Manage category
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/promos"
            >
              Manage promo
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/groups"
            >
              Manage group
            </Link>
          </div>
        </div>

        {event.courses?.length ? (
          <section>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Categories
            </h2>
            <ul className="mt-3 divide-y divide-border border border-border">
              {event.courses.map((course) => (
                <li
                  className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                  key={course.id}
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {course.name}
                      <span className="ml-2 text-muted-foreground">
                        {course.distance}
                        {course.elevation ? ` · ${course.elevation}` : ''}
                        {course.maxParticipants != null
                          ? ` · ${course.maxParticipants} spots`
                          : ''}
                      </span>
                    </p>
                    {course.description.trim() ? (
                      <p className="mt-1 text-muted-foreground">
                        {course.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    <CategoryFormDialog
                      category={{
                        id: course.id,
                        name: course.name,
                        description: course.description.trim() || null,
                        distance:
                          course.distance === '—' ? null : course.distance,
                        price: course.price,
                        serviceFee: course.serviceFee ?? 0,
                        maxParticipants: course.maxParticipants ?? null,
                        sortOrder: 0,
                      }}
                      eventKind={event.kind}
                      eventSlug={event.slug}
                      mode="edit"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Participants ({participants.length})
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border px-4 py-4">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Paid participants
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight">
                {paidParticipants}
              </p>
            </div>
            <div className="rounded-lg border border-border px-4 py-4">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Total transactions
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight">
                {formatIdr(entryFeeTotal)}
              </p>
            </div>
          </div>

          {participants.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No one has registered for this event yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Email</th>
                      {!isFlagship ? (
                        <th className="px-4 py-2.5 font-medium">Phone</th>
                      ) : null}
                      {isFlagship ? (
                        <>
                          <th className="px-4 py-2.5 font-medium">Category</th>
                          <th className="px-4 py-2.5 font-medium">Group</th>
                          <th className="px-4 py-2.5 font-medium">Jersey</th>
                        </>
                      ) : null}
                      {isPaid ? (
                        <th className="px-4 py-2.5 font-medium">Payment</th>
                      ) : null}
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageParticipants.map((participant) => (
                      <ParticipantRow
                        eventSlug={event.slug}
                        isFlagship={isFlagship}
                        isPaid={isPaid}
                        key={participant.id}
                        participant={participant}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                onPageChange={setPageIndex}
                pageCount={pageCount}
                pageIndex={safePageIndex}
              />
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function isPaidParticipant(participant: EventParticipantRow) {
  if (participant.status === 'cancelled' || participant.status === 'draft') {
    return false
  }
  return (
    participant.status === 'confirmed' ||
    participant.status === 'completed' ||
    participant.finalPrice === 0
  )
}

function ParticipantRow({
  eventSlug,
  participant,
  isFlagship,
  isPaid,
}: {
  eventSlug: string
  participant: EventParticipantRow
  isFlagship: boolean
  isPaid: boolean
}) {
  const paid = isPaidParticipant(participant)

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 font-medium">{participant.userName}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {participant.userEmail}
      </td>
      {!isFlagship ? (
        <td className="px-4 py-3 text-muted-foreground">
          {participant.userPhone ?? '—'}
        </td>
      ) : null}
      {isFlagship ? (
        <>
          <td className="px-4 py-3">{participant.categoryName ?? '—'}</td>
          <td className="px-4 py-3">{participant.groupName ?? '—'}</td>
          <td className="px-4 py-3">{participant.jerseySize ?? '—'}</td>
        </>
      ) : null}
      {isPaid ? (
        <td className="px-4 py-3">{paid ? 'Paid' : 'Unpaid'}</td>
      ) : null}
      <td className="px-4 py-3">
        <ParticipantStatusBadge status={participant.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          params={{ slug: eventSlug, participantId: participant.id }}
          to="/dashboard/events/$slug/participants/$participantId"
        >
          Detail
        </Link>
      </td>
    </tr>
  )
}

function ParticipantStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
        participantStatusStyles[status] ??
          'border-zinc-200 bg-zinc-100 text-zinc-600',
      )}
    >
      {participantStatusLabel[status] ??
        status.replaceAll('_', ' ')}
    </span>
  )
}
