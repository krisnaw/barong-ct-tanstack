import { formatIdr } from '~/data/events'
import { formatOrderDate } from '~/data/orders'

export type FinancePeriod = 'this_month' | 'last_month' | 'this_year'

/** Manual income categories — amounts are net (after gateway fees when relevant). */
export type IncomeSource = 'event' | 'shop' | 'sponsor' | 'other'

export type FinanceIncomeRow = {
  id: string
  date: string
  source: IncomeSource
  eventId: string | null
  eventName: string | null
  note: string
  amount: number
}

export type ExpenseCategory =
  | 'event_ops'
  | 'merchandise'
  | 'shipping'
  | 'fees'
  | 'marketing'
  | 'admin'
  | 'other'

export type FinanceExpenseRow = {
  id: string
  date: string
  category: ExpenseCategory
  eventId: string | null
  eventName: string | null
  note: string
  amount: number
}

export type FinanceEventOption = {
  id: string
  name: string
}

export const financePeriodOptions: {
  value: FinancePeriod
  label: string
}[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
]

export const expenseCategoryOptions: {
  value: ExpenseCategory
  label: string
}[] = [
  { value: 'event_ops', label: 'Event ops' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'fees', label: 'Fees' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'admin', label: 'Admin' },
  { value: 'other', label: 'Other' },
]

export const incomeSourceOptions: {
  value: IncomeSource
  label: string
}[] = [
  { value: 'event', label: 'Event' },
  { value: 'shop', label: 'Shop' },
  { value: 'sponsor', label: 'Sponsor / brand' },
  { value: 'other', label: 'Other' },
]

export const incomeSourceFilterOptions = [
  { value: 'all' as const, label: 'All' },
  ...incomeSourceOptions,
]

export function formatFinanceMoney(amount: number) {
  return formatIdr(amount)
}

export function formatFinanceDate(isoDate: string) {
  return formatOrderDate(`${isoDate}T00:00:00+08:00`)
}

export function expenseCategoryLabel(category: ExpenseCategory) {
  return (
    expenseCategoryOptions.find((option) => option.value === category)?.label ??
    category
  )
}

export function incomeSourceLabel(source: IncomeSource) {
  return (
    incomeSourceOptions.find((option) => option.value === source)?.label ??
    source
  )
}

/** Business date in Asia/Makassar as YYYY-MM-DD. */
export function todayFinanceDate(now: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

function parseIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function todayInMakassar(now: Date = new Date()) {
  const [year, month, day] = todayFinanceDate(now).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getPeriodRange(
  period: FinancePeriod,
  today: Date = todayInMakassar(),
) {
  if (period === 'this_month') {
    const start = startOfMonth(today)
    const end = startOfNextMonth(today)
    return { start, end }
  }
  if (period === 'last_month') {
    const thisMonth = startOfMonth(today)
    const start = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1)
    return { start, end: thisMonth }
  }
  const start = startOfYear(today)
  const end = new Date(today.getFullYear() + 1, 0, 1)
  return { start, end }
}

export function formatPeriodLabel(
  period: FinancePeriod,
  today: Date = todayInMakassar(),
) {
  const { start, end } = getPeriodRange(period, today)
  const lastInclusive = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  })
  if (period === 'this_year') {
    return String(today.getFullYear())
  }
  return `${fmt.format(start)} – ${fmt.format(lastInclusive)}`
}

function inPeriod(isoDate: string, period: FinancePeriod) {
  const { start, end } = getPeriodRange(period)
  const date = parseIsoDate(isoDate)
  return date >= start && date < end
}

export function filterIncomeByPeriod(
  rows: FinanceIncomeRow[],
  period: FinancePeriod,
) {
  return rows
    .filter((row) => inPeriod(row.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function filterExpensesByPeriod(
  rows: FinanceExpenseRow[],
  period: FinancePeriod,
) {
  return rows
    .filter((row) => inPeriod(row.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function summarizeFinance(
  income: FinanceIncomeRow[],
  expenses: FinanceExpenseRow[],
) {
  const incomeTotal = income.reduce((sum, row) => sum + row.amount, 0)
  const expenseTotal = expenses.reduce((sum, row) => sum + row.amount, 0)

  return {
    incomeTotal,
    expenseTotal,
    net: incomeTotal - expenseTotal,
  }
}
