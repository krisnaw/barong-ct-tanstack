import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import { event } from 'db/schemas/event'
import { financeExpense, financeIncome } from 'db/schemas/finance'
import type {
  ExpenseCategory,
  FinanceExpenseRow,
  FinanceEventOption,
  FinanceIncomeRow,
  IncomeSource,
} from '~/data/finance'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'

const incomeSourceSchema = z.enum(['event', 'shop', 'sponsor', 'other'])
const expenseCategorySchema = z.enum([
  'event_ops',
  'merchandise',
  'shipping',
  'fees',
  'marketing',
  'admin',
  'other',
])

const incomeInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: incomeSourceSchema,
  eventId: z.string().min(1).nullable(),
  note: z.string().trim().max(400).default(''),
  amount: z.number().int().positive(),
})

const updateIncomeSchema = incomeInputSchema.extend({
  id: z.string().min(1),
})

const expenseInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: expenseCategorySchema,
  eventId: z.string().min(1).nullable(),
  note: z.string().trim().max(400).default(''),
  amount: z.number().int().positive(),
})

const updateExpenseSchema = expenseInputSchema.extend({
  id: z.string().min(1),
})

async function requireAdmin() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session || !hasAdminRole(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

function mapIncome(
  row: typeof financeIncome.$inferSelect,
  eventName: string | null,
): FinanceIncomeRow {
  return {
    id: row.id,
    date: row.date,
    source: row.source as IncomeSource,
    eventId: row.eventId,
    eventName,
    note: row.note,
    amount: row.amount,
  }
}

function mapExpense(
  row: typeof financeExpense.$inferSelect,
  eventName: string | null,
): FinanceExpenseRow {
  return {
    id: row.id,
    date: row.date,
    category: row.category as ExpenseCategory,
    eventId: row.eventId,
    eventName,
    note: row.note,
    amount: row.amount,
  }
}

async function loadIncomeRows(): Promise<FinanceIncomeRow[]> {
  const rows = await db
    .select({
      income: financeIncome,
      eventName: event.name,
    })
    .from(financeIncome)
    .leftJoin(event, eq(financeIncome.eventId, event.id))
    .orderBy(desc(financeIncome.date), desc(financeIncome.createdAt))

  return rows.map(({ income, eventName }) =>
    mapIncome(income, eventName ?? null),
  )
}

async function loadExpenseRows(): Promise<FinanceExpenseRow[]> {
  const rows = await db
    .select({
      expense: financeExpense,
      eventName: event.name,
    })
    .from(financeExpense)
    .leftJoin(event, eq(financeExpense.eventId, event.id))
    .orderBy(desc(financeExpense.date), desc(financeExpense.createdAt))

  return rows.map(({ expense, eventName }) =>
    mapExpense(expense, eventName ?? null),
  )
}

async function loadIncomeRow(id: string): Promise<FinanceIncomeRow | null> {
  const [row] = await db
    .select({
      income: financeIncome,
      eventName: event.name,
    })
    .from(financeIncome)
    .leftJoin(event, eq(financeIncome.eventId, event.id))
    .where(eq(financeIncome.id, id))
    .limit(1)
  return row ? mapIncome(row.income, row.eventName ?? null) : null
}

async function loadExpenseRow(id: string): Promise<FinanceExpenseRow | null> {
  const [row] = await db
    .select({
      expense: financeExpense,
      eventName: event.name,
    })
    .from(financeExpense)
    .leftJoin(event, eq(financeExpense.eventId, event.id))
    .where(eq(financeExpense.id, id))
    .limit(1)
  return row ? mapExpense(row.expense, row.eventName ?? null) : null
}

export const listFinanceIncome = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return loadIncomeRows()
  },
)

export const listFinanceExpenses = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return loadExpenseRows()
  },
)

export const listFinanceEvents = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FinanceEventOption[]> => {
    await requireAdmin()
    const rows = await db
      .select({ id: event.id, name: event.name })
      .from(event)
      .orderBy(asc(event.eventDate), asc(event.name))
    return rows
  },
)

export const createFinanceIncome = createServerFn({ method: 'POST' })
  .validator(incomeInputSchema)
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const id = crypto.randomUUID()
    await db.insert(financeIncome).values({
      id,
      date: data.date,
      source: data.source,
      eventId: data.eventId,
      note: data.note,
      amount: data.amount,
      createdBy: session.user.id,
    })
    const created = await loadIncomeRow(id)
    if (!created) throw new Error('Failed to create income')
    return created
  })

export const updateFinanceIncome = createServerFn({ method: 'POST' })
  .validator(updateIncomeSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await loadIncomeRow(data.id)
    if (!existing) throw new Error('Income not found')

    await db
      .update(financeIncome)
      .set({
        date: data.date,
        source: data.source,
        eventId: data.eventId,
        note: data.note,
        amount: data.amount,
        updatedAt: new Date(),
      })
      .where(eq(financeIncome.id, data.id))

    const updated = await loadIncomeRow(data.id)
    if (!updated) throw new Error('Failed to update income')
    return updated
  })

export const deleteFinanceIncome = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await loadIncomeRow(data.id)
    if (!existing) throw new Error('Income not found')
    await db.delete(financeIncome).where(eq(financeIncome.id, data.id))
    return { ok: true as const }
  })

export const createFinanceExpense = createServerFn({ method: 'POST' })
  .validator(expenseInputSchema)
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const id = crypto.randomUUID()
    await db.insert(financeExpense).values({
      id,
      date: data.date,
      category: data.category,
      eventId: data.eventId,
      note: data.note,
      amount: data.amount,
      createdBy: session.user.id,
    })
    const created = await loadExpenseRow(id)
    if (!created) throw new Error('Failed to create expense')
    return created
  })

export const updateFinanceExpense = createServerFn({ method: 'POST' })
  .validator(updateExpenseSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await loadExpenseRow(data.id)
    if (!existing) throw new Error('Expense not found')

    await db
      .update(financeExpense)
      .set({
        date: data.date,
        category: data.category,
        eventId: data.eventId,
        note: data.note,
        amount: data.amount,
        updatedAt: new Date(),
      })
      .where(eq(financeExpense.id, data.id))

    const updated = await loadExpenseRow(data.id)
    if (!updated) throw new Error('Failed to update expense')
    return updated
  })

export const deleteFinanceExpense = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await loadExpenseRow(data.id)
    if (!existing) throw new Error('Expense not found')
    await db.delete(financeExpense).where(eq(financeExpense.id, data.id))
    return { ok: true as const }
  })
