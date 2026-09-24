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

export const mockFinanceEvents: FinanceEventOption[] = [
  { id: 'evt_sunrise', name: 'Sunrise Century 2026' },
  { id: 'evt_coastal', name: 'Coastal Gran Fondo' },
  { id: 'evt_club', name: 'Club Ride — September' },
]

/** Fixed “today” so mock period filters stay predictable in demos. */
const MOCK_TODAY = new Date('2026-09-24T12:00:00+08:00')

export const mockFinanceIncome: FinanceIncomeRow[] = [
  {
    id: 'inc_1',
    date: '2026-09-22',
    source: 'event',
    eventId: 'evt_sunrise',
    eventName: 'Sunrise Century 2026',
    note: 'Registrations net (after gateway fee) · 12–21 Sep',
    amount: 12_450_000,
  },
  {
    id: 'inc_2',
    date: '2026-09-21',
    source: 'shop',
    eventId: null,
    eventName: null,
    note: 'Shop payout net · 1–20 Sep',
    amount: 4_180_000,
  },
  {
    id: 'inc_3',
    date: '2026-09-15',
    source: 'sponsor',
    eventId: 'evt_sunrise',
    eventName: 'Sunrise Century 2026',
    note: 'Acme Cycles title sponsor',
    amount: 25_000_000,
  },
  {
    id: 'inc_4',
    date: '2026-09-05',
    source: 'other',
    eventId: null,
    eventName: null,
    note: 'Member donation',
    amount: 500_000,
  },
  {
    id: 'inc_5',
    date: '2026-08-28',
    source: 'event',
    eventId: 'evt_coastal',
    eventName: 'Coastal Gran Fondo',
    note: 'Registrations net (after gateway fee) · August',
    amount: 8_920_000,
  },
  {
    id: 'inc_6',
    date: '2026-08-20',
    source: 'shop',
    eventId: null,
    eventName: null,
    note: 'Shop payout net · August',
    amount: 3_450_000,
  },
  {
    id: 'inc_7',
    date: '2026-07-10',
    source: 'sponsor',
    eventId: null,
    eventName: null,
    note: 'Hydration brand deal · Q3',
    amount: 10_000_000,
  },
]

export const mockFinanceExpenses: FinanceExpenseRow[] = [
  {
    id: 'exp_1',
    date: '2026-09-20',
    category: 'event_ops',
    eventId: 'evt_sunrise',
    eventName: 'Sunrise Century 2026',
    note: 'Medals deposit',
    amount: 2_400_000,
  },
  {
    id: 'exp_2',
    date: '2026-09-14',
    category: 'merchandise',
    eventId: null,
    eventName: null,
    note: 'Jersey production batch',
    amount: 8_750_000,
  },
  {
    id: 'exp_3',
    date: '2026-09-05',
    category: 'marketing',
    eventId: 'evt_sunrise',
    eventName: 'Sunrise Century 2026',
    note: 'Instagram ads',
    amount: 500_000,
  },
  {
    id: 'exp_4',
    date: '2026-08-22',
    category: 'shipping',
    eventId: null,
    eventName: null,
    note: 'Courier top-up',
    amount: 320_000,
  },
  {
    id: 'exp_5',
    date: '2026-08-03',
    category: 'admin',
    eventId: null,
    eventName: null,
    note: 'Domain renewal',
    amount: 250_000,
  },
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

export function getPeriodRange(
  period: FinancePeriod,
  today: Date = MOCK_TODAY,
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
  today: Date = MOCK_TODAY,
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

export function createExpenseId() {
  return `exp_${Date.now().toString(36)}`
}

export function createIncomeId() {
  return `inc_${Date.now().toString(36)}`
}
