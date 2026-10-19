import { type EventStatus } from '~/data/events'
import { StatusBadge } from '~/components/status-badge'

const eventStatusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
  archived: 'Archived',
}

const eventStatusTone: Record<EventStatus, string> = {
  draft: 'bg-sky-50 text-sky-800',
  open: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-zinc-100 text-zinc-600',
  archived: 'bg-amber-50 text-amber-900',
}

export function eventStatusText(status: EventStatus) {
  return eventStatusLabel[status]
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <StatusBadge className={eventStatusTone[status]}>
      {eventStatusLabel[status]}
    </StatusBadge>
  )
}
