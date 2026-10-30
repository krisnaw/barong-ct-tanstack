import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { Button, buttonVariants } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  DataTable,
  type DataTableFeatures,
} from '~/components/data-table'
import { StatusBadge } from '~/components/status-badge'
import { formatIdr } from '~/data/events'
import { formatOrderDate } from '~/data/orders'
import type { EventParticipantRow } from '~/lib/event.functions'
import { cn } from '~/lib/utils'

const participantStatusStyles: Record<string, string> = {
  draft: 'bg-sky-50 text-sky-800',
  pending_payment: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-rose-50 text-rose-800',
}

const participantStatusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_payment: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

const statusFilterItems = [
  { value: 'all', label: 'All' },
  { value: 'pending_payment', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
] as const

type StatusFilter = (typeof statusFilterItems)[number]['value']

const columnHelper = createColumnHelper<
  DataTableFeatures,
  EventParticipantRow
>()

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function participantsCsv(participants: Array<EventParticipantRow>) {
  const rows = [
    ['Name', 'Registered at', 'Jersey size', 'Total'],
    ...participants.map((participant) => [
      participant.userName,
      formatOrderDate(participant.createdAt),
      participant.jerseySize ?? '',
      formatIdr(participant.price + participant.donationAmount),
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

function downloadParticipantsCsv(
  eventSlug: string,
  participants: Array<EventParticipantRow>,
) {
  const blob = new Blob([`\uFEFF${participantsCsv(participants)}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${eventSlug.replace(/[^\w.-]+/g, '-')}-participants.csv`
  link.click()
  URL.revokeObjectURL(url)
}

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
              formatIdr(
                row.original.price + row.original.donationAmount,
              ),
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
  actions,
}: {
  eventSlug: string
  participants: Array<EventParticipantRow>
  isFlagship: boolean
  isPaid: boolean
  actions?: React.ReactNode
}) {
  const statusFilterId = React.useId()
  const [nameQuery, setNameQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const columns = React.useMemo(
    () => participantColumns({ eventSlug, isFlagship, isPaid }),
    [eventSlug, isFlagship, isPaid],
  )
  const filteredParticipants = React.useMemo(() => {
    const query = nameQuery.trim().toLowerCase()
    return participants.filter((participant) => {
      const matchesName =
        query.length === 0 ||
        participant.userName.toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all'
          ? participant.status === 'pending_payment' ||
            participant.status === 'confirmed'
          : participant.status === statusFilter
      return matchesName && matchesStatus
    })
  }, [participants, nameQuery, statusFilter])
  const confirmedParticipants = React.useMemo(
    () =>
      participants.filter((participant) => participant.status === 'confirmed'),
    [participants],
  )
  const hasFilter = nameQuery.trim().length > 0 || statusFilter !== 'all'

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Search by name"
          className="max-w-sm"
          onChange={(event) => setNameQuery(event.target.value)}
          placeholder="Search by name…"
          value={nameQuery}
        />
        <Select
          items={[...statusFilterItems]}
          onValueChange={(value) => {
            if (value == null) return
            setStatusFilter(value as StatusFilter)
          }}
          value={statusFilter}
        >
          <SelectTrigger className="min-w-44" id={statusFilterId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilterItems.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-3">
          {actions}
          <Button
            disabled={confirmedParticipants.length === 0}
            onClick={() =>
              downloadParticipantsCsv(eventSlug, confirmedParticipants)
            }
            type="button"
            variant="outline"
          >
            Download CSV
          </Button>
        </div>
      </div>
      <DataTable
        key={`${nameQuery}\0${statusFilter}`}
        columns={columns}
        data={filteredParticipants}
        emptyMessage={
          hasFilter
            ? 'No matching participants.'
            : 'No one has registered for this event yet.'
        }
        getRowId={(row) => row.id}
        tableClassName="min-w-[40rem]"
      />
    </div>
  )
}

export function ParticipantStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      className={
        participantStatusStyles[status] ?? 'bg-zinc-100 text-zinc-600'
      }
    >
      {participantStatusLabel[status] ?? status.replaceAll('_', ' ')}
    </StatusBadge>
  )
}
