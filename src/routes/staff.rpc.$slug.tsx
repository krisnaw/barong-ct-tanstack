import * as React from 'react'
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  TShirtIcon,
} from '@phosphor-icons/react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { toast } from '~/components/ui/toast'
import {
  formatRpcCollectedAt,
  matchesRpcQuery,
  rpcCategoryStats,
} from '~/data/staff-rpc'
import { cn } from '~/lib/utils'
import { getStaffRpcDesk, markKitCollected } from '~/lib/rpc.functions'
import { seo } from '~/utils/seo'

const collectionTabs = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'collected', label: 'Collected' },
] as const

type CollectionTab = (typeof collectionTabs)[number]['id']

const emptyCopy: Record<CollectionTab, { title: string; description: string }> =
  {
    all: {
      title: 'No confirmed riders',
      description: 'Confirmed registrations show up here for kit collection.',
    },
    waiting: {
      title: 'Nothing left to collect',
      description: 'Riders who still need a kit show up here.',
    },
    collected: {
      title: 'No kits collected yet',
      description: 'Kits you mark collected show up here.',
    },
  }

export const Route = createFileRoute('/staff/rpc/$slug')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const desk = await getStaffRpcDesk({ data: { slug: params.slug } })
    if (!desk) throw notFound()
    return desk
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.event.name} · RPC · Staff | Barong Cycling Team`,
          description: `Mark kit collection for ${loaderData.event.name}.`,
        })
      : undefined,
  }),
  component: StaffRpcDeskPage,
})

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function csvFilename(eventName: string) {
  const slug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'event'}-rpc.csv`
}

function StaffRpcDeskPage() {
  const desk = Route.useLoaderData()
  const router = useRouter()
  const searchId = React.useId()
  const [query, setQuery] = React.useState('')
  const [tab, setTab] = React.useState<CollectionTab>('all')
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  const stats = rpcCategoryStats(desk.participants)
  const matched = desk.participants.filter((participant) =>
    matchesRpcQuery(participant, query),
  )
  const counts: Record<CollectionTab, number> = {
    all: matched.length,
    waiting: matched.filter((participant) => !participant.kitCollectedAt).length,
    collected: matched.filter((participant) => participant.kitCollectedAt)
      .length,
  }
  const visible =
    tab === 'all'
      ? matched
      : matched.filter((participant) =>
          tab === 'collected'
            ? participant.kitCollectedAt
            : !participant.kitCollectedAt,
        )
  const filtersActive = query.trim().length > 0 || tab !== 'all'

  function downloadCsv() {
    const rows = [
      ['Bib', 'Name', 'Category', 'Jersey', 'Collected'],
      ...visible.map((participant) => [
        participant.bibNumber ?? '',
        participant.name,
        participant.categoryName ?? '',
        participant.jerseySize ?? '',
        participant.kitCollectedAt
          ? formatRpcCollectedAt(participant.kitCollectedAt, desk.event.timeZone)
          : '',
      ]),
    ]
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = csvFilename(desk.event.name)
    link.click()
    URL.revokeObjectURL(url)
  }

  async function collect(id: string) {
    if (pendingId) return
    setPendingId(id)
    try {
      const result = await markKitCollected({ data: { id } })
      toast.add({
        type: 'success',
        title: result.already ? 'Kit already collected' : 'Kit collected',
      })
      await router.invalidate()
    } catch {
      toast.add({ type: 'error', title: 'Could not mark kit collected' })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          to="/staff/rpc"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Race pack collection
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {desk.event.name}
        </h1>
        {desk.event.locationName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {desk.event.locationName}
          </p>
        ) : null}
      </div>

      {stats.length === 0 ? (
        <div className="rounded-lg border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Collected</p>
          <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
            0
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <div
              className="rounded-lg border border-border px-4 py-3"
              key={stat.categoryName}
            >
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {stat.categoryName}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Collected</dt>
                  <dd className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
                    {stat.collected}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{stat.total}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Remaining</dt>
                  <dd className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
                    {stat.remaining}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor={searchId}>Search</Label>
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or bib"
              value={query}
            />
          </div>
        </div>
        <Button
          disabled={visible.length === 0}
          onClick={downloadCsv}
          type="button"
          variant="outline"
        >
          <DownloadSimpleIcon />
          Download
        </Button>
      </div>

      <div
        aria-label="Collection status"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
        role="tablist"
      >
        {collectionTabs.map((item) => {
          const active = tab === item.id
          return (
            <button
              aria-selected={active}
              className={cn(
                '-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              key={item.id}
              onClick={() => setTab(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
              <span className="tabular-nums text-xs text-muted-foreground">
                {counts[item.id]}
              </span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TShirtIcon />
            </EmptyMedia>
            <EmptyTitle>
              {query.trim() ? 'No riders found' : emptyCopy[tab].title}
            </EmptyTitle>
            <EmptyDescription>
              {query.trim()
                ? 'Try another name or bib number.'
                : emptyCopy[tab].description}
            </EmptyDescription>
          </EmptyHeader>
          {filtersActive ? (
            <EmptyContent>
              <Button
                onClick={() => {
                  setQuery('')
                  setTab('all')
                }}
                type="button"
                variant="outline"
              >
                Clear filters
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
        <ul className="flex flex-col gap-3 md:hidden">
          {visible.map((participant) => {
            const collected = participant.kitCollectedAt != null
            const pending = pendingId === participant.id
            return (
              <li
                className="rounded-lg border border-border px-4 py-3"
                key={participant.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{participant.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Bib {participant.bibNumber ?? '—'}
                      <span className="text-border"> · </span>
                      {participant.categoryName ?? '—'}
                      <span className="text-border"> · </span>
                      <span className="uppercase">
                        {participant.jerseySize ?? '—'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {participant.kitCollectedAt
                        ? formatRpcCollectedAt(
                            participant.kitCollectedAt,
                            desk.event.timeZone,
                          )
                        : 'Not collected'}
                    </p>
                  </div>
                  <Button
                    className="shrink-0"
                    disabled={collected || pendingId != null}
                    onClick={() => void collect(participant.id)}
                    size="sm"
                    type="button"
                    variant={collected ? 'outline' : 'default'}
                  >
                    {pending ? <Spinner /> : null}
                    {collected ? 'Collected' : 'Collect'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 pl-4">Bib</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Jersey</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead className="pr-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((participant) => {
                const collected = participant.kitCollectedAt != null
                const pending = pendingId === participant.id
                return (
                  <TableRow key={participant.id}>
                    <TableCell className="pl-4 font-medium tabular-nums">
                      {participant.bibNumber ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-40 whitespace-normal">
                      {participant.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {participant.categoryName ?? '—'}
                    </TableCell>
                    <TableCell className="uppercase text-muted-foreground">
                      {participant.jerseySize ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {participant.kitCollectedAt
                        ? formatRpcCollectedAt(
                            participant.kitCollectedAt,
                            desk.event.timeZone,
                          )
                        : '—'}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        disabled={collected || pendingId != null}
                        onClick={() => void collect(participant.id)}
                        size="sm"
                        type="button"
                        variant={collected ? 'outline' : 'default'}
                      >
                        {pending ? <Spinner /> : null}
                        {collected ? 'Collected' : 'Collect'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        </>
      )}
    </div>
  )
}
