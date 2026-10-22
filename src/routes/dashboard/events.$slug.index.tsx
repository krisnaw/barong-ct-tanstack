import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { formatIdr } from '~/data/events'
import { CategoryFormDialog } from '~/routes/dashboard/events.$slug.categories'
import {
  EventParticipantsTable,
  isPaidParticipant,
} from '~/components/event-participants-table'
import {
  getEventBySlug,
  listEventParticipants,
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
import { RegisterEventUserDialog } from '~/components/register-event-user-dialog'

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
  const listedParticipants = participants.filter(
    (participant) =>
      participant.status === 'pending_payment' ||
      participant.status === 'confirmed',
  )
  const confirmedParticipants = participants.filter(isPaidParticipant)
  const paidParticipants = confirmedParticipants.length
  const entryFeeTotal = confirmedParticipants.reduce(
    (sum, participant) => sum + participant.price,
    0,
  )
  const donationTotal = confirmedParticipants.reduce(
    (sum, participant) => sum + participant.donationAmount,
    0,
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
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {event.courses.map((course) => (
                <li
                  className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3 text-sm"
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Participants ({listedParticipants.length})
            </h2>
            <RegisterEventUserDialog
              courses={event.courses ?? []}
              eventSlug={event.slug}
              hasJersey={Boolean(event.hasJersey)}
              registeredEmails={participants
                .filter((participant) => participant.status !== 'cancelled')
                .map((participant) => participant.userEmail)}
            />
          </div>

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
            {event.hasCharity ? (
              <div className="rounded-lg border border-border px-4 py-4">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Total donations
                </p>
                <p className="mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight">
                  {formatIdr(donationTotal)}
                </p>
              </div>
            ) : null}
          </div>

          <EventParticipantsTable
            eventSlug={event.slug}
            isFlagship={isFlagship}
            isPaid={isPaid}
            participants={listedParticipants}
          />
        </section>
      </div>
    </>
  )
}

