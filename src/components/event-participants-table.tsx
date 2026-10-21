import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { buttonVariants } from '~/components/ui/button'
import {
  DataTable,
  type DataTableFeatures,
} from '~/components/data-table'
import type { EventParticipantRow } from '~/lib/event.functions'
import { cn } from '~/lib/utils'

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

const columnHelper = createColumnHelper<
  DataTableFeatures,
  EventParticipantRow
>()

export function isPaidParticipant(participant: EventParticipantRow) {
  if (participant.status === 'cancelled' || participant.status === 'draft') {
    return false
  }
  return (
    participant.status === 'confirmed' ||
    participant.status === 'completed' ||
    participant.finalPrice === 0
  )
}

function participantColumns({
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
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('userEmail', {
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue()}</span>
      ),
    }),
    ...(!isFlagship
      ? [
          columnHelper.accessor('userPhone', {
            header: 'Phone',
            cell: ({ getValue }) => (
              <span className="text-muted-foreground">
                {getValue() ?? '—'}
              </span>
            ),
          }),
        ]
      : []),
    ...(isFlagship
      ? [
          columnHelper.accessor('categoryName', {
            header: 'Category',
            cell: ({ getValue }) => getValue() ?? '—',
          }),
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
            id: 'payment',
            header: 'Payment',
            cell: ({ row }) =>
              isPaidParticipant(row.original) ? 'Paid' : 'Unpaid',
          }),
        ]
      : []),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <ParticipantStatusBadge status={row.original.status} />
      ),
    }),
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

export function EventParticipantsTable({
  eventSlug,
  participants,
  isFlagship,
  isPaid,
}: {
  eventSlug: string
  participants: Array<EventParticipantRow>
  isFlagship: boolean
  isPaid: boolean
}) {
  const columns = React.useMemo(
    () => participantColumns({ eventSlug, isFlagship, isPaid }),
    [eventSlug, isFlagship, isPaid],
  )

  return (
    <DataTable
      className="mt-3"
      columns={columns}
      data={participants}
      emptyMessage="No one has registered for this event yet."
      getRowId={(row) => row.id}
      tableClassName="min-w-[40rem]"
    />
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
      {participantStatusLabel[status] ?? status.replaceAll('_', ' ')}
    </span>
  )
}
