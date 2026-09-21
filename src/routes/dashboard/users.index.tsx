import * as React from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type PaginationState,
} from '@tanstack/react-table'
import { z } from 'zod'
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
  listUsers,
  markUserVerified,
  updateUserRole,
  type AdminUserListItem,
  type AdminUserRole,
} from '~/lib/user.functions'

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})

const columnHelper = createColumnHelper<typeof features, AdminUserListItem>()

const columns = columnHelper.columns([
  columnHelper.accessor((row) => `${row.name} ${row.email}`, {
    id: 'user',
    header: 'User',
    cell: ({ row }) => <UserCell account={row.original} />,
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: ({ row }) => <RoleCell account={row.original} />,
  }),
  columnHelper.display({
    id: 'member',
    header: 'Member',
    cell: ({ row }) => <MemberCell account={row.original} />,
  }),
])

const usersSearchSchema = z.object({
  q: z.string().trim().optional().catch(undefined),
})

export const Route = createFileRoute('/dashboard/users/')({
  pendingComponent: DashboardTableSkeleton,
  pendingMs: 150,
  validateSearch: usersSearchSchema,
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: ({ deps: { q } }) => listUsers({ data: { q } }),
  component: DashboardUsersPage,
})

function DashboardUsersPage() {
  const { users } = Route.useLoaderData()
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [draft, setDraft] = React.useState(q ?? '')
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: TABLE_PAGE_SIZE,
  })

  React.useEffect(() => {
    setDraft(q ?? '')
  }, [q])

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim()
      const current = (q ?? '').trim()
      if (next === current) return
      void navigate({
        replace: true,
        search: (prev) => ({
          ...prev,
          q: next || undefined,
        }),
      })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draft, navigate, q])

  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    )
  }, [q])

  const table = useTable({
    features,
    data: users,
    columns,
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
  })
  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const hasQuery = Boolean((q ?? '').trim())

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
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <Input
          className="max-w-sm"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search by name or email…"
          value={draft}
        />

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
                          cell.column.id === 'member' ||
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
                    {hasQuery ? 'No matching users.' : 'No users yet.'}
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
              {saving ? (<><Spinner /> Saving…</>) : 'Save role'}
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

function MemberCell({ account }: { account: AdminUserListItem }) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)

  async function verify(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (saving || account.verifiedAt) return
    setSaving(true)
    try {
      await markUserVerified({ data: { id: account.id } })
      await router.invalidate()
      toast.add({ type: 'success', title: 'Marked as verified member' })
    } catch {
      toast.add({ type: 'error', title: 'Could not verify member' })
    } finally {
      setSaving(false)
    }
  }

  if (account.verifiedAt) {
    return (
      <span className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Member
      </span>
    )
  }

  return (
    <Button
      disabled={saving}
      onClick={(event) => void verify(event)}
      size="sm"
      type="button"
      variant="outline"
    >
      {saving ? (<><Spinner /> Verifying…</>) : 'Verify member'}
    </Button>
  )
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
