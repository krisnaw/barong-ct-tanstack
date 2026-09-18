import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  getEventBySlug,
  listEventGroups,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/dashboard/events/$slug/groups')({
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event) throw notFound()
    const groups = await listEventGroups({ data: { slug: params.slug } })
    return { event, groups }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `Groups · ${loaderData.event.name} · Dashboard | Barong Cycling Team`,
          description: `Groups for ${loaderData.event.name}.`,
        })
      : undefined,
  }),
  component: DashboardEventGroupsPage,
})

function DashboardEventGroupsPage() {
  const { event, groups } = Route.useLoaderData()

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  render={
                    <Link
                      params={{ slug: event.slug }}
                      to="/dashboard/events/$slug"
                    />
                  }
                >
                  {event.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Groups</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Manage group
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {groups.length} {groups.length === 1 ? 'group' : 'groups'} ·{' '}
              {event.name}
              {event.groupCapacity
                ? ` · max ${event.groupCapacity} per group`
                : ''}
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            params={{ slug: event.slug }}
            to="/dashboard/events/$slug"
          >
            Back to event
          </Link>
        </div>

        {groups.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No groups yet for this event.
          </p>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Group</TableHead>
                  <TableHead className="px-4">Category</TableHead>
                  <TableHead className="px-4">Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="px-4 py-3 font-medium">
                      {group.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {group.categoryName ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {group.memberCount}
                      {event.groupCapacity
                        ? ` / ${event.groupCapacity}`
                        : ''}
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
