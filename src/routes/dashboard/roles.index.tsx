import * as React from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type PaginationState,
} from '@tanstack/react-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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
import { Spinner } from '~/components/ui/spinner'
import { DashboardTableSkeleton } from '~/components/page-skeletons'
import {
  TABLE_PAGE_SIZE,
  TablePagination,
} from '~/components/table-pagination'
import {
  adminUserRoles,
  findUserByEmail,
  listStaffUsers,
  updateUserRole,
  type AdminUserListItem,
  type AdminUserRole,
} from '~/lib/user.functions'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
})

const columnHelper = createColumnHelper<typeof features, AdminUserListItem>()

const columns = columnHelper.columns([
  columnHelper.accessor((row) => `${row.name} ${row.email}`, {
    id: 'user',
    header: 'User',
    cell: ({ row }) => <UserCell account={row.original} />,
    filterFn: 'includesString',
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: ({ row }) => <RoleCell account={row.original} />,
    enableGlobalFilter: false,
  }),
])

export const Route = createFileRoute('/dashboard/roles/')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  loader: () => listStaffUsers(),
  component: DashboardRolesPage,
})

function DashboardRolesPage() {
  const { users } = Route.useLoaderData()
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: TABLE_PAGE_SIZE,
  })

  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    )
  }, [globalFilter])

  const table = useTable({
    features,
    data: users,
    columns,
    getRowId: (row) => row.id,
    state: { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: 'includesString',
  })
  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const hasQuery = Boolean(globalFilter.trim())

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
              <BreadcrumbItem>
                <BreadcrumbPage>Roles</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Roles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} admin and staff accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            className="max-w-sm"
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search by name or email…"
            value={globalFilter}
          />
          <AssignRoleSheet />
        </div>

        <div className="border border-border">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead className="px-4" key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow className="relative" key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        className={
                          cell.column.id === 'role'
                            ? 'relative z-10 px-4 py-3'
                            : 'px-4 py-3'
                        }
                        key={cell.id}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 px-4 text-center text-muted-foreground"
                    colSpan={columns.length}
                  >
                    {hasQuery
                      ? 'No matching staff.'
                      : 'No admin or staff users yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
          pageCount={pageCount}
          pageIndex={pagination.pageIndex}
        />
      </div>
    </>
  )
}

function UserCell({ account }: { account: AdminUserListItem }) {
  return (
    <Link
      className="flex items-center gap-3 after:absolute after:inset-0"
      params={{ id: account.id }}
      to="/dashboard/users/$id"
    >
      <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-heading text-xs font-semibold">
        {account.image ? (
          <img
            alt=""
            className="size-full object-cover"
            decoding="async"
            src={account.image}
          />
        ) : (
          userInitials(account.name, account.email)
        )}
      </div>
      <span className="min-w-0">
        <span className="block truncate font-medium">{account.name}</span>
        <span className="mt-0.5 block truncate text-muted-foreground">
          {account.email}
        </span>
        {account.banned ? (
          <span className="mt-0.5 block text-[0.65rem] font-medium tracking-[0.14em] text-destructive uppercase">
            Banned
          </span>
        ) : null}
      </span>
    </Link>
  )
}

function AssignRoleSheet() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [found, setFound] = React.useState<AdminUserListItem | null>(null)
  const [searched, setSearched] = React.useState(false)
  const [role, setRole] = React.useState<AdminUserRole>('staff')
  const [searching, setSearching] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  function reset() {
    setEmail('')
    setFound(null)
    setSearched(false)
    setRole('staff')
    setSearching(false)
    setSaving(false)
  }

  async function search(event?: React.FormEvent) {
    event?.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.add({ type: 'error', title: 'Enter an email to search' })
      return
    }

    setSearching(true)
    setSearched(false)
    setFound(null)
    try {
      const user = await findUserByEmail({ data: { email: trimmed } })
      setFound(user)
      setSearched(true)
      if (user) {
        setRole(normalizeRole(user.role))
      }
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not search user',
      })
    } finally {
      setSearching(false)
    }
  }

  async function assign() {
    if (!found) return
    if (role === normalizeRole(found.role)) {
      toast.add({ type: 'error', title: 'That role is already assigned' })
      return
    }

    setSaving(true)
    try {
      await updateUserRole({ data: { id: found.id, role } })
      await router.invalidate()
      toast.add({
        type: 'success',
        title: `Role updated to ${roleLabel(role)}`,
      })
      setOpen(false)
      reset()
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not update role',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      open={open}
    >
      <SheetTrigger render={<Button type="button" />}>Assign role</SheetTrigger>
      <SheetContent className="gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Assign role</SheetTitle>
          <SheetDescription>
            Search for a user by email, then set their dashboard role.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <form className="grid gap-3" onSubmit={(event) => void search(event)}>
            <div className="grid gap-1.5">
              <Label htmlFor="assign-role-email">Email</Label>
              <Input
                autoComplete="email"
                id="assign-role-email"
                onChange={(event) => {
                  setEmail(event.target.value)
                  setSearched(false)
                  setFound(null)
                }}
                placeholder="rider@example.com"
                type="email"
                value={email}
              />
            </div>
            <Button disabled={searching} type="submit" variant="outline">
              {searching ? (
                <>
                  <Spinner /> Searching…
                </>
              ) : (
                'Search'
              )}
            </Button>
          </form>

          {searched && !found ? (
            <p className="text-sm text-muted-foreground">
              No user found with that email.
            </p>
          ) : null}

          {found ? (
            <div className="grid gap-4 border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-heading text-xs font-semibold">
                  {found.image ? (
                    <img
                      alt=""
                      className="size-full object-cover"
                      decoding="async"
                      src={found.image}
                    />
                  ) : (
                    userInitials(found.name, found.email)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{found.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {found.email}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Current: {found.role}
                  </p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="assign-role-select">Role</Label>
                <Select
                  items={roleSelectItems}
                  onValueChange={(value) => {
                    if (value == null) return
                    setRole(value as AdminUserRole)
                  }}
                  value={role}
                >
                  <SelectTrigger className="w-full" id="assign-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleSelectItems.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-border">
          <Button
            disabled={!found || saving || role === normalizeRole(found?.role ?? '')}
            onClick={() => void assign()}
            type="button"
          >
            {saving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              'Save role'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function roleLabel(role: AdminUserRole) {
  if (role === 'admin') return 'Admin'
  if (role === 'staff') return 'Staff'
  return 'User'
}

const roleSelectItems = adminUserRoles.map((option) => ({
  value: option,
  label: roleLabel(option),
}))

function RoleCell({ account }: { account: AdminUserListItem }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [role, setRole] = React.useState<AdminUserRole>(
    normalizeRole(account.role),
  )
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) setRole(normalizeRole(account.role))
  }, [open, account.role])

  async function save() {
    if (role === normalizeRole(account.role)) {
      setOpen(false)
      return
    }
    setSaving(true)
    try {
      await updateUserRole({ data: { id: account.id, role } })
      await router.invalidate()
      toast.add({ type: 'success', title: `Role updated to ${role}` })
      setOpen(false)
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'Could not update role',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {account.role}
      </span>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger
          render={
            <Button
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              size="sm"
              type="button"
              variant="outline"
            />
          }
        >
          Change
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Update the dashboard role for {account.name} ({account.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={`role-${account.id}`}>Role</Label>
            <Select
              items={roleSelectItems}
              onValueChange={(value) => {
                if (value == null) return
                setRole(value as AdminUserRole)
              }}
              value={role}
            >
              <SelectTrigger className="w-full" id={`role-${account.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleSelectItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={saving || role === normalizeRole(account.role)}
              onClick={() => void save()}
            >
              {saving ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : (
                'Save role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function normalizeRole(role: string): AdminUserRole {
  return adminUserRoles.includes(role as AdminUserRole)
    ? (role as AdminUserRole)
    : 'user'
}

function userInitials(name: string, email: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length > 0) {
    return parts
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}
