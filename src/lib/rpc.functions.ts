import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import { user } from 'db/schemas/auth'
import { event, eventCategory, eventParticipant } from 'db/schemas/event'
import type { EventStatus } from '~/data/events'
import type { StaffRpcParticipant } from '~/data/staff-rpc'
import { auth } from '~/lib/auth'
import { hasStaffAccess } from '~/lib/auth.functions'

const eventStatuses = ['draft', 'open', 'closed', 'archived'] as const

export type StaffRpcEvent = {
  slug: string
  name: string
  eventDate: string
  locationName: string
  timeZone: string
  status: EventStatus
}

export type StaffRpcDesk = {
  event: {
    slug: string
    name: string
    locationName: string
    timeZone: string
    eventDate: string
  }
  participants: StaffRpcParticipant[]
}

function asEventStatus(value: string): EventStatus {
  return eventStatuses.includes(value as EventStatus)
    ? (value as EventStatus)
    : 'draft'
}

async function requireStaffAccess() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session || !hasStaffAccess(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

export const listStaffRpcEvents = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StaffRpcEvent[]> => {
    await requireStaffAccess()
    const rows = await db.query.event.findMany({
      where: eq(event.hasJersey, true),
      orderBy: [desc(event.eventDate), desc(event.createdAt)],
      columns: {
        slug: true,
        name: true,
        eventDate: true,
        locationName: true,
        timeZone: true,
        status: true,
      },
    })
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      eventDate: row.eventDate,
      locationName: row.locationName,
      timeZone: row.timeZone,
      status: asEventStatus(row.status),
    }))
  },
)

export const getStaffRpcDesk = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }): Promise<StaffRpcDesk | null> => {
    await requireStaffAccess()
    const eventRow = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      columns: {
        id: true,
        slug: true,
        name: true,
        locationName: true,
        timeZone: true,
        eventDate: true,
        hasJersey: true,
      },
    })
    if (!eventRow || !eventRow.hasJersey) return null

    const rows = await db
      .select({
        id: eventParticipant.id,
        bibNumber: eventParticipant.bibNumber,
        jerseySize: eventParticipant.jerseySize,
        kitCollectedAt: eventParticipant.kitCollectedAt,
        name: user.name,
        categoryName: eventCategory.name,
      })
      .from(eventParticipant)
      .innerJoin(user, eq(user.id, eventParticipant.userId))
      .leftJoin(
        eventCategory,
        eq(eventCategory.id, eventParticipant.eventCategoryId),
      )
      .where(
        and(
          eq(eventParticipant.eventId, eventRow.id),
          eq(eventParticipant.status, 'confirmed'),
        ),
      )
      .orderBy(asc(eventParticipant.bibNumber), asc(user.name))

    return {
      event: {
        slug: eventRow.slug,
        name: eventRow.name,
        locationName: eventRow.locationName,
        timeZone: eventRow.timeZone,
        eventDate: eventRow.eventDate,
      },
      participants: rows.map((row) => ({
        id: row.id,
        name: row.name,
        bibNumber: row.bibNumber,
        jerseySize: row.jerseySize,
        categoryName: row.categoryName,
        kitCollectedAt: row.kitCollectedAt?.toISOString() ?? null,
      })),
    }
  })

export const markKitCollected = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireStaffAccess()
    const row = await db.query.eventParticipant.findFirst({
      where: eq(eventParticipant.id, data.id),
      with: { event: true },
    })
    if (!row) {
      throw new Error('Participant was not found.')
    }
    if (!row.event.hasJersey) {
      throw new Error('This event does not use race pack collection.')
    }
    if (row.status !== 'confirmed') {
      throw new Error('Only confirmed registrations can collect a kit.')
    }
    if (row.kitCollectedAt) {
      return {
        kitCollectedAt: row.kitCollectedAt.toISOString(),
        already: true,
      }
    }

    const collectedAt = new Date()
    await db
      .update(eventParticipant)
      .set({ kitCollectedAt: collectedAt })
      .where(
        and(
          eq(eventParticipant.id, row.id),
          isNull(eventParticipant.kitCollectedAt),
        ),
      )

    const saved = await db.query.eventParticipant.findFirst({
      where: eq(eventParticipant.id, row.id),
      columns: { kitCollectedAt: true },
    })

    return {
      kitCollectedAt: (saved?.kitCollectedAt ?? collectedAt).toISOString(),
      already: false,
    }
  })
