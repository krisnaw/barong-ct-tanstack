import * as React from 'react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import {
  createEventGroup,
  deleteEventGroup,
  getEventBySlug,
  listEventCategories,
  listEventGroups,
  updateEventGroup,
  type EventCategoryRow,
  type EventGroupRow,
} from '~/lib/event.functions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
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
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'

const NONE_CATEGORY = '__none__'

export const Route = createFileRoute('/dashboard/events/$slug/groups')({
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event) throw notFound()
    const [groups, categories] = await Promise.all([
      listEventGroups({ data: { slug: params.slug } }),
      listEventCategories({ data: { slug: params.slug } }),
    ])
    return { event, groups, categories }
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
  const { event, groups, categories } = Route.useLoaderData()

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
          <div className="flex flex-wrap gap-2">
            <GroupFormDialog
              categories={categories}
              eventSlug={event.slug}
              mode="create"
            />
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              params={{ slug: event.slug }}
              to="/dashboard/events/$slug"
            >
              Back to event
            </Link>
          </div>
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
                  <TableHead className="px-4 text-right">Actions</TableHead>
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
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <GroupFormDialog
                          categories={categories}
                          eventSlug={event.slug}
                          group={group}
                          mode="edit"
                        />
                        <DeleteGroupDialog
                          eventSlug={event.slug}
                          group={group}
                        />
                      </div>
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

function GroupFormDialog({
  mode,
  eventSlug,
  categories,
  group,
}: {
  mode: 'create' | 'edit'
  eventSlug: string
  categories: EventCategoryRow[]
  group?: EventGroupRow
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [categoryId, setCategoryId] = React.useState(NONE_CATEGORY)
  const [saving, setSaving] = React.useState(false)

  const categoryItems = [
    { value: NONE_CATEGORY, label: 'No category' },
    ...categories.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ]

  React.useEffect(() => {
    if (!open) return
    if (mode === 'edit' && group) {
      setName(group.name)
      setCategoryId(group.courseId || NONE_CATEGORY)
      return
    }
    setName('')
    setCategoryId(NONE_CATEGORY)
  }, [open, mode, group])

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.add({ type: 'error', title: 'Group name is required' })
      return
    }

    const payload = {
      slug: eventSlug,
      name: trimmed,
      categoryId: categoryId === NONE_CATEGORY ? null : categoryId,
    }

    setSaving(true)
    try {
      if (mode === 'edit' && group) {
        await updateEventGroup({ data: { ...payload, id: group.id } })
        toast.add({ type: 'success', title: 'Group updated' })
      } else {
        await createEventGroup({ data: payload })
        toast.add({ type: 'success', title: 'Group created' })
      }
      await router.invalidate()
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error
            ? error.message
            : mode === 'edit'
              ? 'Could not update group'
              : 'Could not create group',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
          />
        }
      >
        {mode === 'create' ? 'Add group' : 'Edit'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add group' : 'Edit group'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new group for this event.'
              : 'Update group details.'}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={`group-name-${mode}-${group?.id ?? 'new'}`}>
              Name
            </FieldLabel>
            <Input
              id={`group-name-${mode}-${group?.id ?? 'new'}`}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team Barong"
              required
              value={name}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`group-category-${mode}-${group?.id ?? 'new'}`}>
              Category
            </FieldLabel>
            <Select
              items={categoryItems}
              onValueChange={(value) => {
                if (value == null) return
                setCategoryId(value)
              }}
              value={categoryId}
            >
              <SelectTrigger
                className="w-full"
                id={`group-category-${mode}-${group?.id ?? 'new'}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={saving} onClick={() => void save()} type="button">
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteGroupDialog({
  eventSlug,
  group,
}: {
  eventSlug: string
  group: EventGroupRow
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteEventGroup({
        data: { slug: eventSlug, id: group.id },
      })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Group deleted' })
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not delete group',
      })
      setDeleting(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={<Button size="sm" type="button" variant="outline" />}
      >
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {group.name}?</DialogTitle>
          <DialogDescription>
            This permanently removes the group
            {group.memberCount > 0
              ? `. ${group.memberCount} ${group.memberCount === 1 ? 'member' : 'members'} will be unassigned from it`
              : ''}
            . This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={deleting}
            onClick={() => void confirmDelete()}
            type="button"
            variant="destructive"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
