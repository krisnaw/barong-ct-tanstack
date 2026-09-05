import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { getEvent, type EventStatus } from '~/data/events'
import {
  getRegistrations,
  type EventRegistration,
  type RegistrationStatus,
} from '~/data/registrations'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

const eventStatusStyles: Record<EventStatus, string> = {
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  upcoming: 'border-sky-200 bg-sky-50 text-sky-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
}

export const Route = createFileRoute('/dashboard/events/$slug')({
  loader: ({ params }) => {
    const event = getEvent(params.slug)
    if (!event) {
      throw notFound()
    }
    const participants = getRegistrations(params.slug)
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
  const isFull = event.registration === 'full'

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
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge status={event.status} />
          <span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {event.registration} registration
          </span>
        </div>

        {event.routes?.length ? (
          <section>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Routes
            </h2>
            <ul className="mt-3 divide-y divide-border border border-border">
              {event.routes.map((route) => (
                <li className="px-4 py-3 text-sm" key={route.id}>
                  <p className="font-medium">
                    {route.name}
                    <span className="ml-2 text-muted-foreground">
                      {route.distance}
                      {route.elevation ? ` · ${route.elevation}` : ''}
                    </span>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {route.description}
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
                    {!isFull ? (
                      <th className="px-4 py-2.5 font-medium">Phone</th>
                    ) : null}
                    {isFull ? (
                      <>
                        <th className="px-4 py-2.5 font-medium">Jersey</th>
                        <th className="px-4 py-2.5 font-medium">Size</th>
                        <th className="px-4 py-2.5 font-medium">Route</th>
                        <th className="px-4 py-2.5 font-medium">Payment</th>
                      </>
                    ) : null}
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {participants.map((participant) => (
                    <ParticipantRow
                      isFull={isFull}
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
  participant,
  isFull,
}: {
  participant: EventRegistration
  isFull: boolean
}) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium">{participant.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{participant.email}</td>
      {!isFull ? (
        <td className="px-4 py-3 text-muted-foreground">{participant.phone}</td>
      ) : null}
      {isFull ? (
        <>
          <td className="px-4 py-3">{participant.jerseyName ?? '—'}</td>
          <td className="px-4 py-3">{participant.jerseySize ?? '—'}</td>
          <td className="px-4 py-3">{participant.routeName ?? '—'}</td>
          <td className="px-4 py-3">
            {participant.paid ? 'Paid' : 'Unpaid'}
          </td>
        </>
      ) : null}
      <td className="px-4 py-3">
        <StatusLabel status={participant.status} />
      </td>
    </tr>
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

function StatusLabel({ status }: { status: RegistrationStatus }) {
  return (
    <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
      {status}
    </span>
  )
}
