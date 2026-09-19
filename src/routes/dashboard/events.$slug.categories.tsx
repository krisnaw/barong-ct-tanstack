import * as React from 'react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { formatIdr, type EventKind } from '~/data/events'
import {
  createEventCategory,
  getEventBySlug,
  listEventCategories,
  updateEventCategory,
  type EventCategoryRow,
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
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

export const Route = createFileRoute('/dashboard/events/$slug/categories')({
  loader: async ({ params }) => {
    const event = await getEventBySlug({
      data: { slug: params.slug, includeDraft: true },
    })
    if (!event) throw notFound()
    const categories = await listEventCategories({ data: { slug: params.slug } })
    return { event, categories }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `Categories · ${loaderData.event.name} · Dashboard | Barong Cycling Team`,
          description: `Categories for ${loaderData.event.name}.`,
        })
      : undefined,
  }),
  component: DashboardEventCategoriesPage,
})

function DashboardEventCategoriesPage() {
  const { event, categories } = Route.useLoaderData()
  const isPaid = event.kind === 'paid' || event.kind === 'flagship'

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
                <BreadcrumbPage>Categories</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Manage category
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {categories.length}{' '}
              {categories.length === 1 ? 'category' : 'categories'} · {event.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryFormDialog
              eventKind={event.kind}
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

        {categories.length === 0 ? (
          <p className="border border-border px-4 py-8 text-sm text-muted-foreground">
            No categories yet for this event.
          </p>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead className="px-4">Distance</TableHead>
                  {isPaid ? (
                    <>
                      <TableHead className="px-4">Price</TableHead>
                      <TableHead className="px-4">Fee</TableHead>
                    </>
                  ) : null}
                  <TableHead className="px-4">Slots</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="px-4 py-3">
                      <p className="font-medium">{category.name}</p>
                      {category.description?.trim() ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {category.distance?.trim() || '—'}
                    </TableCell>
                    {isPaid ? (
                      <>
                        <TableCell className="px-4 py-3 tabular-nums">
                          {formatIdr(category.price)}
                        </TableCell>
                        <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                          {formatIdr(category.serviceFee)}
                        </TableCell>
                      </>
                    ) : null}
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {category.maxParticipants != null
                        ? category.maxParticipants
                        : 'Unlimited'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <CategoryFormDialog
                        category={category}
                        eventKind={event.kind}
                        eventSlug={event.slug}
                        mode="edit"
                      />
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

function CategoryFormDialog({
  mode,
  eventSlug,
  eventKind,
  category,
}: {
  mode: 'create' | 'edit'
  eventSlug: string
  eventKind: EventKind
  category?: EventCategoryRow
}) {
  const router = useRouter()
  const isPaid = eventKind === 'paid' || eventKind === 'flagship'
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [distance, setDistance] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [price, setPrice] = React.useState('0')
  const [serviceFee, setServiceFee] = React.useState('0')
  const [slots, setSlots] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (mode === 'edit' && category) {
      setName(category.name)
      setDistance(category.distance ?? '')
      setDescription(category.description ?? '')
      setPrice(String(category.price))
      setServiceFee(String(category.serviceFee))
      setSlots(
        category.maxParticipants != null ? String(category.maxParticipants) : '',
      )
      return
    }
    setName('')
    setDistance('')
    setDescription('')
    setPrice(isPaid ? '' : '0')
    setServiceFee('0')
    setSlots('')
  }, [open, mode, category, isPaid])

  async function save() {
    const trimmedName = name.trim()
    const trimmedDistance = distance.trim()
    if (!trimmedName) {
      toast.add({ type: 'error', title: 'Name is required' })
      return
    }
    if (!trimmedDistance) {
      toast.add({ type: 'error', title: 'Distance is required' })
      return
    }

    const priceAmount = Number(price.replace(/\D/g, '') || 0)
    const serviceFeeAmount = Number(serviceFee.replace(/\D/g, '') || 0)
    if (isPaid && priceAmount <= 0) {
      toast.add({
        type: 'error',
        title: 'Paid and flagship categories need a price greater than 0',
      })
      return
    }

    const slotsValue = slots.replace(/\D/g, '')
    const payload = {
      slug: eventSlug,
      name: trimmedName,
      distance: trimmedDistance,
      description: description.trim() || undefined,
      price: isPaid ? priceAmount : 0,
      serviceFee: isPaid ? serviceFeeAmount : 0,
      maxParticipants: slotsValue ? Number(slotsValue) : null,
    }

    setSaving(true)
    try {
      if (mode === 'edit' && category) {
        await updateEventCategory({
          data: { ...payload, id: category.id },
        })
        toast.add({ type: 'success', title: 'Category updated' })
      } else {
        await createEventCategory({ data: payload })
        toast.add({ type: 'success', title: 'Category created' })
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
              ? 'Could not update category'
              : 'Could not create category',
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
        {mode === 'create' ? 'Add category' : 'Edit'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add category' : 'Edit category'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new category for this event.'
              : 'Update category details.'}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={`category-name-${mode}-${category?.id ?? 'new'}`}>
              Name
            </FieldLabel>
            <Input
              id={`category-name-${mode}-${category?.id ?? 'new'}`}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gran Fondo"
              required
              value={name}
            />
          </Field>
          <Field>
            <FieldLabel
              htmlFor={`category-distance-${mode}-${category?.id ?? 'new'}`}
            >
              Distance
            </FieldLabel>
            <Input
              id={`category-distance-${mode}-${category?.id ?? 'new'}`}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="80 km"
              required
              value={distance}
            />
          </Field>
          <Field>
            <FieldLabel
              htmlFor={`category-description-${mode}-${category?.id ?? 'new'}`}
            >
              Description
            </FieldLabel>
            <textarea
              className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id={`category-description-${mode}-${category?.id ?? 'new'}`}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes for this category"
              value={description}
            />
          </Field>
          {isPaid ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel
                  htmlFor={`category-price-${mode}-${category?.id ?? 'new'}`}
                >
                  Price
                </FieldLabel>
                <Input
                  id={`category-price-${mode}-${category?.id ?? 'new'}`}
                  inputMode="numeric"
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="350000"
                  value={price}
                />
              </Field>
              <Field>
                <FieldLabel
                  htmlFor={`category-fee-${mode}-${category?.id ?? 'new'}`}
                >
                  Service fee
                </FieldLabel>
                <Input
                  id={`category-fee-${mode}-${category?.id ?? 'new'}`}
                  inputMode="numeric"
                  onChange={(e) => setServiceFee(e.target.value)}
                  placeholder="0"
                  value={serviceFee}
                />
              </Field>
            </div>
          ) : null}
          <Field>
            <FieldLabel
              htmlFor={`category-slots-${mode}-${category?.id ?? 'new'}`}
            >
              Slots
            </FieldLabel>
            <Input
              id={`category-slots-${mode}-${category?.id ?? 'new'}`}
              inputMode="numeric"
              onChange={(e) => setSlots(e.target.value)}
              placeholder="Unlimited"
              value={slots}
            />
            <FieldDescription>Leave empty for unlimited.</FieldDescription>
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
