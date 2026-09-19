import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { type EventStatus } from '~/data/events'
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

const eventStatusStyles: Record<EventStatus, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

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
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/edit"
            >
              Edit
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/categories"
            >
              Manage category
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug/promos"
            >
              Manage promo
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
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
                <li className="px-4 py-3 text-sm" key={course.id}>
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
                  <p className="mt-1 text-muted-foreground">
                    {course.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Participants ({participants.length})
          </h2>

          {participants.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No one has registered for this event yet.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto border border-border">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participants.map((participant) => (
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
          )}
        </section>
      </div>
    </>
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
  const paid =
    participant.status === 'confirmed' || participant.finalPrice === 0

  return (
    <tr className="relative hover:bg-muted/30">
      <td className="px-4 py-3 font-medium">
        <Link
          className="after:absolute after:inset-0"
          params={{ slug: eventSlug, participantId: participant.id }}
          to="/dashboard/events/$slug/participants/$participantId"
        >
          {participant.userName}
        </Link>
      </td>
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

function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
        eventStatusStyles[status],
      )}
    >
      {status}
    </span>
  )
}
