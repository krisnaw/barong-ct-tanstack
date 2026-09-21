import * as React from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { type ClubEvent, type EventStatus } from '~/data/events'
import { listEvents, updateEventStatus } from '~/lib/event.functions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb'
import { Button, buttonVariants } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { formatEventWhenParts } from '~/lib/event-datetime'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'
import { DashboardTableSkeleton } from '~/components/page-skeletons'

const eventStatusStyles: Record<EventStatus, string> = {
  draft: 'border-sky-200 bg-sky-50 text-sky-800',
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  archived: 'border-amber-200 bg-amber-50 text-amber-900',
}

const eventStatusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
  archived: 'Archived',
}

const statusSelectItems = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
] as const

export const Route = createFileRoute('/dashboard/events/')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: async () =>
    (await listEvents({ data: { includeDraft: true } })) ?? [],
  head: () => ({
    meta: seo({
      title: 'Events · Dashboard | Barong Cycling Team',
      description: 'Manage Barong Cycling Team events.',
    }),
  }),
  component: DashboardEventsPage,
})

function DashboardEventsPage() {
  const events = Route.useLoaderData()

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
              <BreadcrumbItem>
                <BreadcrumbPage>Events</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Events
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              to="/events"
            >
              View public
            </Link>
            <Link
              className={cn(buttonVariants({ size: 'sm' }))}
              to="/dashboard/events/new"
            >
              Create event
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No events yet. Create one to publish it on the ride calendar.
          </p>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Event</TableHead>
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id ?? event.slug}>
                    <TableCell className="px-4 py-3 font-medium">
                      {event.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <EventWhenCell event={event} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex border px-2 py-0.5 text-[0.65rem] font-medium tracking-[0.14em] uppercase',
                          eventStatusStyles[event.status],
                        )}
                      >
                        {eventStatusLabel[event.status]}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <EventActions event={event} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}

function EventWhenCell({ event }: { event: ClubEvent }) {
  const { date, time } = formatEventWhenParts(
    event.eventDate,
    event.eventTime,
    event.timeZone,
  )

  return (
    <div className="leading-snug">
      <p>{date}</p>
      <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  )
}

function EventActions({ event }: { event: ClubEvent }) {
  if (!event.id) return null

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ChangeStatusDialog event={event} />
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        params={{ slug: event.slug }}
        to="/dashboard/events/$slug"
      >
        Detail
      </Link>
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        params={{ slug: event.slug }}
        to="/dashboard/events/$slug/edit"
      >
        Edit
      </Link>
    </div>
  )
}

function ChangeStatusDialog({ event }: { event: ClubEvent }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState<EventStatus>(event.status)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) setStatus(event.status)
  }, [open, event.status])

  async function save() {
    if (!event.id) return
    if (status === event.status) {
      setOpen(false)
      return
    }
    setSaving(true)
    try {
      await updateEventStatus({ data: { id: event.id, status } })
      await router.invalidate()
      toast.add({
        type: 'success',
        title: `Status updated to ${eventStatusLabel[status]}`,
      })
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not update status',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={<Button size="sm" type="button" variant="outline" />}
      >
        Status
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            Update publishing status for {event.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor={`status-${event.id}`}>Status</Label>
          <Select
            items={[...statusSelectItems]}
            onValueChange={(value) => {
              if (value == null) return
              setStatus(value as EventStatus)
            }}
            value={status}
          >
            <SelectTrigger className="w-full" id={`status-${event.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusSelectItems.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={saving} onClick={() => void save()} type="button">
            {saving ? (<><Spinner /> Saving…</>) : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
