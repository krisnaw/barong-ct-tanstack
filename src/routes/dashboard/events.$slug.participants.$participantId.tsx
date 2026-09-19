import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { formatIdr, JERSEY_SIZES } from '~/data/events'
import { formatOrderDate } from '~/data/orders'
import {
  deleteEventParticipant,
  getEventParticipant,
  listEventCategories,
  listEventGroups,
  updateEventParticipant,
  type EventCategoryRow,
  type EventGroupRow,
  type EventParticipantDetail,
} from '~/lib/event.functions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { toast } from '~/components/ui/toast'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'
import { seo } from '~/utils/seo'
import { DashboardDetailSkeleton } from '~/components/page-skeletons'

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

const participantStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

type ParticipantStatus = (typeof participantStatuses)[number]['value']

const NONE_VALUE = '__none__'

export const Route = createFileRoute(
  '/dashboard/events/$slug/participants/$participantId',
)({
  pendingComponent: DashboardDetailSkeleton,
  pendingMs: 150,
  loader: async ({ params }) => {
    const [participant, categories, groups] = await Promise.all([
      getEventParticipant({
        data: {
          slug: params.slug,
          participantId: params.participantId,
        },
      }),
      listEventCategories({ data: { slug: params.slug } }),
      listEventGroups({ data: { slug: params.slug } }),
    ])
    if (!participant) throw notFound()
    return { participant, categories, groups }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.participant.user.name} · ${loaderData.participant.event.name} · Dashboard | Barong Cycling Team`,
          description: `Participant detail for ${loaderData.participant.user.name}.`,
        })
      : undefined,
  }),
  component: DashboardParticipantDetailPage,
})

function DashboardParticipantDetailPage() {
  const { participant, categories, groups } = Route.useLoaderData()
  const { user, event, payment } = participant
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
                <BreadcrumbPage>{user.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ParticipantStatusBadge status={participant.status} />
              {participant.bibNumber ? (
                <span className="inline-flex items-center border border-border px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-[0.08em] text-muted-foreground">
                  #{participant.bibNumber}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email}
              <span className="text-border"> · </span>
              Registered {formatOrderDate(participant.createdAt)}
            </p>
          </div>
          <EditParticipantDialog
            categories={categories}
            groups={groups}
            participant={participant}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DetailBlock title="Profile">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="Gender" value={user.gender} />
              <InfoRow label="Blood type" value={user.bloodType} />
              <InfoRow label="Date of birth" value={user.dateOfBirth} />
              <InfoRow label="Nationality" value={user.nationality} />
              <InfoRow label="City" value={user.city} />
              <InfoRow label="Province" value={user.province} />
            </dl>
          </DetailBlock>

          <DetailBlock title="Emergency contact">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Name" value={user.emergencyContactName} />
              <InfoRow label="Phone" value={user.emergencyContactPhone} />
            </dl>
          </DetailBlock>

          <DetailBlock title="Registration">
            <dl className="divide-y divide-border text-sm">
              <InfoRow label="Event" value={event.name} />
              <InfoRow label="Category" value={participant.categoryName} />
              <InfoRow label="Group" value={participant.groupName} />
              <InfoRow
                label="Jersey size"
                value={participant.jerseySize?.toUpperCase() ?? null}
              />
              <InfoRow
                label="Bib number"
                value={participant.bibNumber ?? 'Not assigned'}
              />
              <InfoRow
                label="Registered"
                value={formatOrderDate(participant.createdAt)}
              />
            </dl>
          </DetailBlock>

          {isPaid ? (
            <DetailBlock title="Pricing">
              <dl className="divide-y divide-border text-sm">
                <InfoRow label="Price" value={formatIdr(participant.price)} />
                <InfoRow
                  label="Service fee"
                  value={formatIdr(participant.serviceFee)}
                />
                {participant.promoCode ? (
                  <InfoRow
                    label={`Promo (${participant.promoCode})`}
                    value={`−${formatIdr(participant.discountAmount)}`}
                  />
                ) : null}
                <InfoRow
                  label="Total"
                  value={formatIdr(participant.finalPrice)}
                />
              </dl>
            </DetailBlock>
          ) : null}

          {payment ? (
            <DetailBlock title="Payment">
              <dl className="divide-y divide-border text-sm">
                <InfoRow label="Transaction" value={payment.transactionId} />
                <InfoRow label="Status" value={payment.status} />
                <InfoRow label="Method" value={payment.method} />
                <InfoRow label="Amount" value={formatIdr(payment.amount)} />
                <InfoRow
                  label="Paid at"
                  value={
                    payment.paidAt ? formatOrderDate(payment.paidAt) : null
                  }
                />
                {payment.checkoutUrl ? (
                  <div className="flex items-start justify-between gap-4 px-4 py-3">
                    <dt className="shrink-0 text-muted-foreground">
                      Payment link
                    </dt>
                    <dd className="text-right">
                      <a
                        className="text-sm underline underline-offset-2"
                        href={payment.checkoutUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open link
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </DetailBlock>
          ) : null}
        </div>

        <DeleteParticipantCard
          eventSlug={event.slug}
          participantId={participant.id}
          participantName={user.name}
        />
      </div>
    </>
  )
}

function EditParticipantDialog({
  participant,
  categories,
  groups,
}: {
  participant: EventParticipantDetail
  categories: EventCategoryRow[]
  groups: EventGroupRow[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [status, setStatus] = React.useState<ParticipantStatus>(
    normalizeStatus(participant.status),
  )
  const [jerseySize, setJerseySize] = React.useState(
    participant.jerseySize?.toUpperCase() ?? NONE_VALUE,
  )
  const [bibNumber, setBibNumber] = React.useState(participant.bibNumber ?? '')
  const [categoryId, setCategoryId] = React.useState(
    participant.categoryId ?? NONE_VALUE,
  )
  const [groupId, setGroupId] = React.useState(
    participant.groupId ?? NONE_VALUE,
  )

  React.useEffect(() => {
    if (!open) return
    setStatus(normalizeStatus(participant.status))
    setJerseySize(participant.jerseySize?.toUpperCase() ?? NONE_VALUE)
    setBibNumber(participant.bibNumber ?? '')
    setCategoryId(participant.categoryId ?? NONE_VALUE)
    setGroupId(participant.groupId ?? NONE_VALUE)
  }, [open, participant])

  const selectedCategoryId = categoryId === NONE_VALUE ? null : categoryId
  const visibleGroups = groups.filter(
    (group) =>
      !group.courseId ||
      !selectedCategoryId ||
      group.courseId === selectedCategoryId,
  )

  React.useEffect(() => {
    if (groupId === NONE_VALUE) return
    if (visibleGroups.some((group) => group.id === groupId)) return
    setGroupId(NONE_VALUE)
  }, [groupId, visibleGroups])

  async function save() {
    setSaving(true)
    try {
      await updateEventParticipant({
        data: {
          slug: participant.event.slug,
          participantId: participant.id,
          status,
          jerseySize: jerseySize === NONE_VALUE ? null : jerseySize,
          bibNumber: bibNumber.trim() || null,
          categoryId: categoryId === NONE_VALUE ? null : categoryId,
          groupId: groupId === NONE_VALUE ? null : groupId,
        },
      })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Participant updated' })
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error
            ? error.message
            : 'Could not update participant',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={<Button className="shrink-0" type="button" variant="outline" />}
      >
        Edit registration
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit registration</DialogTitle>
          <DialogDescription>
            Update registration details for {participant.user.name}. Changing
            category recalculates price from that category.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="participant-status">Status</FieldLabel>
            <Select
              items={participantStatuses.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onValueChange={(value) => {
                if (value == null) return
                setStatus(value as ParticipantStatus)
              }}
              value={status}
            >
              <SelectTrigger className="w-full" id="participant-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {participantStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="participant-jersey">Jersey size</FieldLabel>
            <Select
              items={[
                { value: NONE_VALUE, label: 'Not set' },
                ...JERSEY_SIZES.map((size) => ({ value: size, label: size })),
              ]}
              onValueChange={(value) => {
                if (value == null) return
                setJerseySize(value)
              }}
              value={jerseySize}
            >
              <SelectTrigger className="w-full" id="participant-jersey">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Not set</SelectItem>
                {JERSEY_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {participant.event.hasJersey ? (
              <FieldDescription>
                This event collects jersey sizes at registration.
              </FieldDescription>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="participant-bib">Bib number</FieldLabel>
            <Input
              id="participant-bib"
              onChange={(event) => setBibNumber(event.target.value)}
              placeholder="Optional"
              value={bibNumber}
            />
          </Field>

          {categories.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="participant-category">Category</FieldLabel>
              <Select
                items={[
                  { value: NONE_VALUE, label: 'No category' },
                  ...categories.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                onValueChange={(value) => {
                  if (value == null) return
                  setCategoryId(value)
                }}
                value={categoryId}
              >
                <SelectTrigger className="w-full" id="participant-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No category</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {groups.length > 0 ? (
            <Field>
              <FieldLabel htmlFor="participant-group">Group</FieldLabel>
              <Select
                items={[
                  { value: NONE_VALUE, label: 'No group' },
                  ...visibleGroups.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                onValueChange={(value) => {
                  if (value == null) return
                  setGroupId(value)
                }}
                value={groupId}
              >
                <SelectTrigger className="w-full" id="participant-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No group</SelectItem>
                  {visibleGroups.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={saving} onClick={() => void save()} type="button">
            {saving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function normalizeStatus(status: string): ParticipantStatus {
  return participantStatuses.some((item) => item.value === status)
    ? (status as ParticipantStatus)
    : 'draft'
}

function DeleteParticipantCard({
  eventSlug,
  participantId,
  participantName,
}: {
  eventSlug: string
  participantId: string
  participantName: string
}) {
  const navigate = useNavigate()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteEventParticipant({
        data: { slug: eventSlug, participantId },
      })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Participant deleted' })
      void navigate({
        to: '/dashboard/events/$slug',
        params: { slug: eventSlug },
      })
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error
            ? error.message
            : 'Could not delete participant',
      })
      setDeleting(false)
    }
  }

  return (
    <section className="border border-destructive/25 bg-destructive/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold tracking-tight text-destructive">
            Delete participant
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Permanently remove this registration and related payment records.
            This cannot be undone.
          </p>
        </div>
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger
            render={
              <Button className="shrink-0" type="button" variant="destructive" />
            }
          >
            Delete participant
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {participantName}?</DialogTitle>
              <DialogDescription>
                This permanently removes their registration for this event and
                any related payment records. You cannot recover it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                disabled={deleting}
                onClick={() => void confirmDelete()}
                type="button"
                variant="destructive"
              >
                {deleting ? (
                  <>
                    <Spinner /> Deleting…
                  </>
                ) : (
                  'Delete permanently'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
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

function DetailBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-border">
      <h2 className="border-b border-border px-4 py-3 font-heading text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right break-all">{value?.trim() ? value : '—'}</dd>
    </div>
  )
}
