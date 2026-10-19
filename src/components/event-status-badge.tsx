import { type EventStatus } from '~/data/events'
import { StatusBadge } from '~/components/status-badge'

const eventStatusLabel: Record<EventStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
  archived: 'Archived',
}

const eventStatusTone: Record<EventStatus, string> = {
  draft: 'text-sky-800',
  open: 'text-emerald-800',
  closed: 'text-zinc-600',
  archived: 'text-amber-900',
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
