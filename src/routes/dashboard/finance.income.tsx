import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  createIncomeId,
  filterIncomeByPeriod,
  financePeriodOptions,
  formatFinanceDate,
  formatFinanceMoney,
  formatPeriodLabel,
  incomeSourceFilterOptions,
  incomeSourceLabel,
  incomeSourceOptions,
  mockFinanceEvents,
  mockFinanceIncome,
  type FinanceIncomeRow,
  type FinancePeriod,
  type IncomeSource,
} from '~/data/finance'
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
} from '~/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field'
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
import { seo } from '~/utils/seo'

const NONE_EVENT = '__none__'

type IncomeSourceFilter = 'all' | IncomeSource

type IncomeFormState = {
  date: string
  amount: string
  source: IncomeSource
  eventId: string
  note: string
}

function emptyIncomeForm(): IncomeFormState {
  return {
    date: '2026-09-24',
    amount: '',
    source: 'event',
    eventId: NONE_EVENT,
    note: '',
  }
}

function formFromIncome(income: FinanceIncomeRow): IncomeFormState {
  return {
    date: income.date,
    amount: String(income.amount),
    source: income.source,
    eventId: income.eventId ?? NONE_EVENT,
    note: income.note,
  }
}

export const Route = createFileRoute('/dashboard/finance/income')({
  head: () => ({
    meta: seo({
      title: 'Income · Finance · Dashboard | Barong Cycling Team',
      description: 'Record net income manually (mock data).',
    }),
  }),
  component: DashboardFinanceIncomePage,
})

function DashboardFinanceIncomePage() {
  const periodId = React.useId()
  const sourceFilterId = React.useId()
  const [period, setPeriod] = React.useState<FinancePeriod>('this_month')
  const [sourceFilter, setSourceFilter] =
    React.useState<IncomeSourceFilter>('all')
  const [income, setIncome] = React.useState(mockFinanceIncome)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<IncomeFormState>(emptyIncomeForm)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const incomeInPeriod = filterIncomeByPeriod(income, period)
  const incomeRows =
    sourceFilter === 'all'
      ? incomeInPeriod
      : incomeInPeriod.filter((row) => row.source === sourceFilter)
  const incomeTotal = incomeRows.reduce((sum, row) => sum + row.amount, 0)
  const deleteTarget = income.find((row) => row.id === deleteId) ?? null

  function openCreate() {
    setEditingId(null)
    setForm(emptyIncomeForm())
    setDialogOpen(true)
  }

  function openEdit(row: FinanceIncomeRow) {
    setEditingId(row.id)
    setForm(formFromIncome(row))
    setDialogOpen(true)
  }

  function saveIncome() {
    const amount = Number(form.amount.replace(/[^\d]/g, ''))
    if (!form.date || !Number.isFinite(amount) || amount <= 0) {
      toast.add({
        type: 'error',
        title: 'Check the form',
        description: 'Date and a positive amount are required.',
      })
      return
    }

    const event =
      form.eventId === NONE_EVENT
        ? null
        : (mockFinanceEvents.find((item) => item.id === form.eventId) ?? null)

    const next: FinanceIncomeRow = {
      id: editingId ?? createIncomeId(),
      date: form.date,
      source: form.source,
      eventId: event?.id ?? null,
      eventName: event?.name ?? null,
      note: form.note.trim() || '—',
      amount,
    }

    setIncome((current) => {
      if (editingId) {
        return current.map((row) => (row.id === editingId ? next : row))
      }
      return [next, ...current]
    })
    setDialogOpen(false)
    toast.add({
      type: 'success',
      title: editingId ? 'Income updated' : 'Income added',
    })
  }

  function confirmDelete() {
    if (!deleteId) return
    setIncome((current) => current.filter((row) => row.id !== deleteId))
    setDeleteId(null)
    toast.add({ type: 'success', title: 'Income deleted' })
  }

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
                <BreadcrumbLink render={<Link to="/dashboard/finance/income" />}>
                  Finance
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Income</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Income
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPeriodLabel(period)} · enter net amounts (after fees)
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={periodId}>Period</Label>
              <Select
                items={financePeriodOptions}
                onValueChange={(value) => {
                  if (value == null) return
                  setPeriod(value as FinancePeriod)
                }}
                value={period}
              >
                <SelectTrigger className="min-w-40" id={periodId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {financePeriodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={sourceFilterId}>Source</Label>
              <Select
                items={incomeSourceFilterOptions}
                onValueChange={(value) => {
                  if (value == null) return
                  setSourceFilter(value as IncomeSourceFilter)
                }}
                value={sourceFilter}
              >
                <SelectTrigger className="min-w-40" id={sourceFilterId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {incomeSourceFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openCreate} type="button">
              Add income
            </Button>
          </div>
        </div>

        <div className="border border-border px-4 py-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Total
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
            {formatFinanceMoney(incomeTotal)}
          </p>
        </div>

        {incomeRows.length === 0 ? (
          <div className="border border-border px-4 py-8 text-sm text-muted-foreground">
            <p>No income recorded for this period.</p>
            <Button className="mt-3" onClick={openCreate} type="button">
              Add income
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4">Source</TableHead>
                  <TableHead className="px-4">Event</TableHead>
                  <TableHead className="px-4">Note</TableHead>
                  <TableHead className="px-4 text-right">Amount</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {formatFinanceDate(row.date)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {incomeSourceLabel(row.source)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {row.eventName ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3">{row.note}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {formatFinanceMoney(row.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openEdit(row)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteId(row.id)}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingId(null)
        }}
        open={dialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit income' : 'Add income'}
            </DialogTitle>
            <DialogDescription>
              Enter the net amount that landed (after payment gateway fees when
              applicable). Session-only mock.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="income-date">Date</FieldLabel>
              <Input
                id="income-date"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                type="date"
                value={form.date}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="income-amount">Amount (IDR, net)</FieldLabel>
              <Input
                id="income-amount"
                inputMode="numeric"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="12450000"
                value={form.amount}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="income-source">Source</FieldLabel>
              <Select
                items={incomeSourceOptions}
                onValueChange={(value) => {
                  if (value == null) return
                  setForm((current) => ({
                    ...current,
                    source: value as IncomeSource,
                  }))
                }}
                value={form.source}
              >
                <SelectTrigger id="income-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {incomeSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="income-event">Event (optional)</FieldLabel>
              <Select
                items={[
                  { value: NONE_EVENT, label: 'None' },
                  ...mockFinanceEvents.map((event) => ({
                    value: event.id,
                    label: event.name,
                  })),
                ]}
                onValueChange={(value) => {
                  if (value == null) return
                  setForm((current) => ({ ...current, eventId: value }))
                }}
                value={form.eventId}
              >
                <SelectTrigger id="income-event">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_EVENT}>None</SelectItem>
                  {mockFinanceEvents.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="income-note">Note</FieldLabel>
              <Input
                id="income-note"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="e.g. Registrations net · 1–15 Sep"
                value={form.note}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={saveIncome} type="button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
        open={deleteId != null}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete income?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove “${deleteTarget.note}” (${formatFinanceMoney(deleteTarget.amount)}).`
                : 'This income entry will be removed from the list.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={confirmDelete} type="button" variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
