import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { JERSEY_SIZES } from '~/data/events'
import { adminRegisterUserForEvent } from '~/lib/event.functions'
import { listUsers, type AdminUserListItem } from '~/lib/user.functions'
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
import { Spinner } from '~/components/ui/spinner'
import { toast } from '~/components/ui/toast'

type RegisterCourse = {
  id: string
  name: string
  distance: string
}

function isJerseySize(value: string): value is (typeof JERSEY_SIZES)[number] {
  return (JERSEY_SIZES as readonly string[]).includes(value)
}

export function RegisterEventUserDialog({
  eventSlug,
  hasJersey,
  courses,
  registeredEmails,
}: {
  eventSlug: string
  hasJersey: boolean
  courses: RegisterCourse[]
  registeredEmails: string[]
}) {
  const router = useRouter()
  const searchId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [users, setUsers] = React.useState<AdminUserListItem[]>([])
  const [loadingUsers, setLoadingUsers] = React.useState(false)
  const [selected, setSelected] = React.useState<AdminUserListItem | null>(null)
  const [categoryId, setCategoryId] = React.useState(courses[0]?.id ?? '')
  const [jerseySize, setJerseySize] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const registered = React.useMemo(
    () => new Set(registeredEmails.map((email) => email.toLowerCase())),
    [registeredEmails],
  )
  const defaultCategoryId = courses[0]?.id ?? ''
  const courseKey = courses.map((course) => course.id).join('\0')

  React.useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(null)
    setUsers([])
    setCategoryId(defaultCategoryId)
    setJerseySize('')
    let cancelled = false
    setLoadingUsers(true)
    listUsers()
      .then((result) => {
        if (!cancelled) setUsers(result.users)
      })
      .catch((error) => {
        if (cancelled) return
        toast.add({
          type: 'error',
          title:
            error instanceof Error ? error.message : 'Could not load users',
        })
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, courseKey, defaultCategoryId])

  const matches = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    const pool = users.filter((account) => !account.banned)
    const filtered = needle
      ? pool.filter(
          (account) =>
            account.name.toLowerCase().includes(needle) ||
            account.email.toLowerCase().includes(needle),
        )
      : pool
    return { rows: filtered.slice(0, 8), hasMore: filtered.length > 8 }
  }, [query, users])

  function chooseUser(account: AdminUserListItem) {
    if (registered.has(account.email.toLowerCase())) return
    setSelected(account)
    if (hasJersey) {
      const size = account.jerseySize.toUpperCase()
      setJerseySize(isJerseySize(size) ? size : '')
    }
  }

  async function register() {
    if (!selected) {
      toast.add({ type: 'error', title: 'Choose a user' })
      return
    }
    if (!categoryId) {
      toast.add({ type: 'error', title: 'Add a category before registering' })
      return
    }
    if (hasJersey && !jerseySize) {
      toast.add({ type: 'error', title: 'Jersey size is required' })
      return
    }

    setSaving(true)
    try {
      await adminRegisterUserForEvent({
        data: {
          slug: eventSlug,
          userId: selected.id,
          categoryId,
          jerseySize: hasJersey ? jerseySize : undefined,
        },
      })
      toast.add({
        type: 'success',
        title: `${selected.name} is registered`,
      })
      await router.invalidate()
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not register user',
      })
    } finally {
      setSaving(false)
    }
  }

  const categoryItems = courses.map((course) => ({
    value: course.id,
    label:
      course.distance && course.distance !== '—'
        ? `${course.name} · ${course.distance}`
        : course.name,
  }))

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button type="button" />}>
        Register user
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register user</DialogTitle>
          <DialogDescription>
            Add an existing account to this event. They are confirmed right
            away and receive the registration email.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={searchId}>User</FieldLabel>
            {selected ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{selected.name}</p>
                  <p className="truncate text-muted-foreground">
                    {selected.email}
                  </p>
                </div>
                <Button
                  onClick={() => setSelected(null)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Input
                  id={searchId}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or email"
                  value={query}
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  {loadingUsers ? (
                    <p className="flex items-center gap-2 px-3 py-3 text-muted-foreground">
                      <Spinner />
                      Loading users…
                    </p>
                  ) : matches.rows.length === 0 ? (
                    <p className="px-3 py-3 text-muted-foreground">
                      No matching users.
                    </p>
                  ) : (
                    <ul>
                      {matches.rows.map((account) => {
                        const taken = registered.has(account.email.toLowerCase())
                        return (
                          <li key={account.id}>
                            <button
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={taken}
                              onClick={() => chooseUser(account)}
                              type="button"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">
                                  {account.name}
                                </span>
                                <span className="block truncate text-muted-foreground">
                                  {account.email}
                                </span>
                              </span>
                              {taken ? (
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  Registered
                                </span>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                {!loadingUsers && matches.hasMore ? (
                  <FieldDescription>
                    Showing the first matches. Search to narrow the list.
                  </FieldDescription>
                ) : null}
              </>
            )}
          </Field>

          {courses.length > 1 ? (
            <Field>
              <FieldLabel htmlFor={`${searchId}-category`}>Category</FieldLabel>
              <Select
                items={categoryItems}
                onValueChange={(value) => {
                  if (value == null) return
                  setCategoryId(value)
                }}
                value={categoryId}
              >
                <SelectTrigger className="w-full" id={`${searchId}-category`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : courses.length === 1 ? (
            <Field>
              <FieldLabel>Category</FieldLabel>
              <p className="text-sm">{categoryItems[0]?.label}</p>
            </Field>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add a category before registering someone.
            </p>
          )}

          {hasJersey ? (
            <Field>
              <FieldLabel htmlFor={`${searchId}-jersey`}>Jersey size</FieldLabel>
              <Select
                items={JERSEY_SIZES.map((size) => ({
                  value: size,
                  label: size,
                }))}
                onValueChange={(value) => {
                  if (value == null) return
                  setJerseySize(value)
                }}
                value={jerseySize || null}
              >
                <SelectTrigger className="w-full" id={`${searchId}-jersey`}>
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {JERSEY_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={saving || courses.length === 0}
            onClick={() => void register()}
            type="button"
          >
            {saving ? (
              <>
                <Spinner /> Registering…
              </>
            ) : (
              'Register'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
