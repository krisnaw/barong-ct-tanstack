import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import { financeIncome } from 'db/schemas/finance'

const settlementSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  settlementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalSettlementAmount: z.number().int().positive(),
})

function settlementNote(subject: string) {
  return subject.replace(/^(fwd:\s*)+/i, '').trim().slice(0, 400)
}

export const Route = createFileRoute('/api/finance/income/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          console.log('income webhook', 'invalid json')
          return new Response('invalid json', { status: 400 })
        }

        const parsed = settlementSchema.safeParse(body)
        if (!parsed.success) {
          console.log('income webhook', 'invalid settlement')
          return new Response('invalid settlement', { status: 400 })
        }

        const { settlementDate, totalSettlementAmount, subject } = parsed.data
        const note = settlementNote(subject)
        console.log(
          'income webhook',
          JSON.stringify({
            settlementDate,
            totalSettlementAmount,
            note,
          }),
        )

        const [existing] = await db
          .select({ id: financeIncome.id })
          .from(financeIncome)
          .where(
            and(
              eq(financeIncome.date, settlementDate),
              eq(financeIncome.source, 'shop'),
              eq(financeIncome.amount, totalSettlementAmount),
            ),
          )
          .limit(1)

        if (existing) {
          console.log('income webhook', 'already recorded', existing.id)
          return new Response('ok')
        }

        const id = crypto.randomUUID()
        await db.insert(financeIncome).values({
          id,
          date: settlementDate,
          source: 'shop',
          eventId: null,
          note,
          amount: totalSettlementAmount,
        })
        console.log('income webhook', 'created', id)
        return new Response('ok')
      },
    },
  },
})
