import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { asc, desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import {
  type ClubEvent,
  type CourseOption,
  type EventKind,
  type EventStatus,
  formatIdr,
} from '~/data/events'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { db } from '~/lib/db'
import {
  event,
  eventCategory,
  eventGroup,
  eventParticipant,
  eventPromo,
} from '~/lib/event-schema'
import { payment } from '~/lib/order-schema'

const eventKindSchema = z.enum(['free', 'paid', 'flagship'])
const eventStatusSchema = z.enum(['draft', 'open', 'closed'])

const categoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  distance: z.string().min(1),
  price: z.number().int().min(0),
  serviceFee: z.number().int().min(0).default(0),
  maxParticipants: z.number().int().positive().nullable().optional(),
})

const createEventSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().default(''),
  regulation: z.string().optional(),
  kind: eventKindSchema,
  status: z.enum(['draft', 'open']),
  eventDate: z.string().min(1),
  eventTime: z.string().min(1),
  timeZone: z.string().min(1),
  locationName: z.string().min(1),
  locationAddress: z.string().optional(),
  registrationClosesAt: z.string().optional(),
  hasJersey: z.boolean().default(false),
  isGroupRide: z.boolean().default(false),
  groupCapacity: z.number().int().positive().nullable().optional(),
  featureImage: z.string().optional(),
  featureImageAlt: z.string().optional(),
  category: categoryInputSchema,
})

const updateEventSchema = createEventSchema.extend({
  id: z.string().min(1),
  status: eventStatusSchema,
  category: categoryInputSchema.extend({
    id: z.string().min(1).optional(),
  }),
})

type EventRow = typeof event.$inferSelect
type CategoryRow = typeof eventCategory.$inferSelect

function formatEventDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

function blurbFromDescription(description: string) {
  const trimmed = description.trim()
  if (!trimmed) return ''
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0] ?? trimmed
  return sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence
}

function mapCourse(row: CategoryRow): CourseOption {
  return {
    id: row.id,
    name: row.name,
    distance: row.distance?.trim() || '—',
    description: row.description?.trim() || '',
    price: row.price,
  }
}

function mapClubEvent(row: EventRow, categories: CategoryRow[]): ClubEvent {
  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
  const primary = ordered[0]
  const feeAmount = primary?.price ?? 0
  const distances = ordered
    .map((item) => item.distance?.trim())
    .filter((value): value is string => Boolean(value))
  const capacity =
    ordered.find((item) => item.maxParticipants != null)?.maxParticipants ??
    null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    date: formatEventDate(row.eventDate),
    time: `${row.eventTime} ${row.timeZone}`.trim(),
    location: row.locationName,
    locationAddress: row.locationAddress ?? undefined,
    distance:
      distances.length > 1
        ? distances.join(' / ')
        : (distances[0] ?? primary?.distance ?? '—'),
    status: row.status as EventStatus,
    kind: row.kind as EventKind,
    blurb: blurbFromDescription(row.description),
    description: row.description,
    regulation: row.regulation ?? undefined,
    image:
      row.featureImage?.trim() ||
      'https://images.unsplash.com/photo-1517649763962-0c623066027e?auto=format&fit=crop',
    imageAlt: row.featureImageAlt?.trim() || row.name,
    featureImage: row.featureImage,
    fee: feeAmount > 0 ? formatIdr(feeAmount) : 'Free',
    feeAmount,
    capacity: capacity != null ? String(capacity) : undefined,
    groupCapacity: row.groupCapacity ?? undefined,
    hasJersey: row.hasJersey,
    courses: ordered.map(mapCourse),
    categoryId: primary?.id,
    categoryName: primary?.name,
    serviceFeeAmount: primary?.serviceFee ?? 0,
    eventDate: row.eventDate,
    eventTime: row.eventTime,
    timeZone: row.timeZone,
    registrationClosesAt: row.registrationClosesAt ?? undefined,
    isGroupRide: row.isGroupRide,
  }
}

async function requireSession() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

async function requireAdmin() {
  const session = await requireSession()
  if (!hasAdminRole(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session
}

async function loadEventBySlug(slug: string, includeDraft: boolean) {
  const row = await db.query.event.findFirst({
    where: eq(event.slug, slug),
    with: {
      categories: {
        orderBy: [asc(eventCategory.sortOrder)],
      },
    },
  })
  if (!row) return null
  if (!includeDraft && row.status === 'draft') return null
  return mapClubEvent(row, row.categories)
}

export const listEvents = createServerFn({ method: 'GET' })
  .validator(
    z
      .object({
        includeDraft: z.boolean().optional(),
        status: eventStatusSchema.optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const includeDraft = data?.includeDraft === true
    if (includeDraft) await requireAdmin()

    const rows = await db.query.event.findMany({
      with: {
        categories: {
          orderBy: [asc(eventCategory.sortOrder)],
        },
      },
      orderBy: [asc(event.eventDate), asc(event.name)],
    })

    return rows
      .filter((row) => {
        if (data?.status) return row.status === data.status
        if (!includeDraft) return row.status !== 'draft'
        return true
      })
      .map((row) => mapClubEvent(row, row.categories))
  })

export const getEventBySlug = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      slug: z.string().min(1),
      includeDraft: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const includeDraft = data.includeDraft === true
    if (includeDraft) await requireAdmin()
    return loadEventBySlug(data.slug, includeDraft)
  })

export type MyEventRegistration = {
  id: string
  status: string
  groupId: string | null
  groupName: string | null
}

export const getMyEventRegistration = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) return null

    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!row) return null

    const participant = await db.query.eventParticipant.findFirst({
      where: and(
        eq(eventParticipant.eventId, row.id),
        eq(eventParticipant.userId, session.user.id),
      ),
      with: {
        group: true,
      },
    })
    if (!participant) return null

    const result: MyEventRegistration = {
      id: participant.id,
      status: participant.status,
      groupId: participant.eventGroupId,
      groupName: participant.group?.name ?? null,
    }
    return result
  })

export const createEvent = createServerFn({ method: 'POST' })
  .validator(createEventSchema)
  .handler(async ({ data }) => {
    await requireAdmin()

    const slug = data.slug.trim()
    const existing = await db.query.event.findFirst({
      where: eq(event.slug, slug),
    })
    if (existing) {
      throw new Error('An event with this slug already exists')
    }

    if (data.kind !== 'free' && data.category.price <= 0) {
      throw new Error('Paid and flagship events need a price greater than 0')
    }

    const id = crypto.randomUUID()
    const categoryId = crypto.randomUUID()
    const price = data.kind === 'free' ? 0 : data.category.price
    const serviceFee = data.kind === 'free' ? 0 : data.category.serviceFee

    await db.batch([
      db.insert(event).values({
        id,
        slug,
        name: data.name.trim(),
        description: data.description.trim(),
        regulation: data.regulation?.trim() || null,
        featureImage: data.featureImage?.trim() || null,
        featureImageAlt: data.featureImageAlt?.trim() || null,
        kind: data.kind,
        status: data.status,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        timeZone: data.timeZone,
        locationName: data.locationName.trim(),
        locationAddress: data.locationAddress?.trim() || null,
        registrationClosesAt: data.registrationClosesAt || null,
        hasJersey: data.hasJersey,
        isGroupRide: data.isGroupRide,
        groupCapacity: data.isGroupRide
          ? (data.groupCapacity ?? null)
          : null,
      }),
      db.insert(eventCategory).values({
        id: categoryId,
        eventId: id,
        name: data.category.name.trim(),
        description: data.category.description?.trim() || null,
        distance: data.category.distance.trim(),
        price,
        serviceFee,
        currency: 'IDR',
        maxParticipants: data.category.maxParticipants ?? null,
        sortOrder: 0,
      }),
    ])

    const created = await loadEventBySlug(slug, true)
    if (!created) {
      throw new Error('Failed to create event')
    }
    return created
  })

export const updateEventStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().min(1),
      status: eventStatusSchema,
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.event.findFirst({
      where: eq(event.id, data.id),
    })
    if (!existing) {
      throw new Error('Event not found')
    }

    await db
      .update(event)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(event.id, data.id))

    return loadEventBySlug(existing.slug, true)
  })

export const updateEvent = createServerFn({ method: 'POST' })
  .validator(updateEventSchema)
  .handler(async ({ data }) => {
    await requireAdmin()

    const existing = await db.query.event.findFirst({
      where: eq(event.id, data.id),
      with: {
        categories: {
          orderBy: [asc(eventCategory.sortOrder)],
        },
      },
    })
    if (!existing) {
      throw new Error('Event not found')
    }

    const nextSlug = data.slug.trim()
    if (nextSlug !== existing.slug) {
      const slugTaken = await db.query.event.findFirst({
        where: eq(event.slug, nextSlug),
      })
      if (slugTaken) {
        throw new Error('An event with this slug already exists')
      }
    }

    if (data.kind !== 'free' && data.category.price <= 0) {
      throw new Error('Paid and flagship events need a price greater than 0')
    }

    const price = data.kind === 'free' ? 0 : data.category.price
    const serviceFee = data.kind === 'free' ? 0 : data.category.serviceFee
    const categoryId =
      data.category.id ??
      existing.categories[0]?.id ??
      crypto.randomUUID()
    const categoryExists = existing.categories.some((item) => item.id === categoryId)

    await db
      .update(event)
      .set({
        slug: nextSlug,
        name: data.name.trim(),
        description: data.description.trim(),
        regulation: data.regulation?.trim() || null,
        featureImage: data.featureImage?.trim() || null,
        featureImageAlt: data.featureImageAlt?.trim() || null,
        kind: data.kind,
        status: data.status,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        timeZone: data.timeZone,
        locationName: data.locationName.trim(),
        locationAddress: data.locationAddress?.trim() || null,
        registrationClosesAt: data.registrationClosesAt || null,
        hasJersey: data.hasJersey,
        isGroupRide: data.isGroupRide,
        groupCapacity: data.isGroupRide
          ? (data.groupCapacity ?? null)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(event.id, data.id))

    if (categoryExists) {
      await db
        .update(eventCategory)
        .set({
          name: data.category.name.trim(),
          description: data.category.description?.trim() || null,
          distance: data.category.distance.trim(),
          price,
          serviceFee,
          currency: 'IDR',
          maxParticipants: data.category.maxParticipants ?? null,
          updatedAt: new Date(),
        })
        .where(eq(eventCategory.id, categoryId))
    } else {
      await db.insert(eventCategory).values({
        id: categoryId,
        eventId: data.id,
        name: data.category.name.trim(),
        description: data.category.description?.trim() || null,
        distance: data.category.distance.trim(),
        price,
        serviceFee,
        currency: 'IDR',
        maxParticipants: data.category.maxParticipants ?? null,
        sortOrder: 0,
      })
    }

    const updated = await loadEventBySlug(nextSlug, true)
    if (!updated) {
      throw new Error('Failed to update event')
    }
    return updated
  })

export const deleteEvent = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const existing = await db.query.event.findFirst({
      where: eq(event.id, data.id),
    })
    if (!existing) {
      throw new Error('Event not found')
    }

    await db.delete(event).where(eq(event.id, data.id))
    return { ok: true as const }
  })

export type EventParticipantRow = {
  id: string
  status: string
  jerseySize: string | null
  bibNumber: string | null
  price: number
  finalPrice: number
  userName: string
  userEmail: string
  userPhone: string | null
  categoryName: string | null
  groupName: string | null
}

export const listEventParticipants = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!row) return [] as EventParticipantRow[]

    const participants = await db.query.eventParticipant.findMany({
      where: eq(eventParticipant.eventId, row.id),
      with: {
        user: {
          with: {
            profile: true,
          },
        },
        category: true,
        group: true,
      },
      orderBy: [desc(eventParticipant.createdAt)],
    })

    return participants.map((item) => ({
      id: item.id,
      status: item.status,
      jerseySize: item.jerseySize,
      bibNumber: item.bibNumber,
      price: item.price,
      finalPrice: item.finalPrice,
      userName: item.user.name,
      userEmail: item.user.email,
      userPhone: item.user.profile?.phone ?? null,
      categoryName: item.category?.name ?? null,
      groupName: item.group?.name ?? null,
    }))
  })

export type EventParticipantDetail = {
  id: string
  status: string
  bibNumber: string | null
  jerseySize: string | null
  price: number
  serviceFee: number
  currency: string
  promoCode: string | null
  discountAmount: number
  finalPrice: number
  createdAt: string
  event: {
    id: string
    name: string
    slug: string
    kind: EventKind
  }
  categoryName: string | null
  groupName: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    gender: string | null
    bloodType: string | null
    dateOfBirth: string | null
    nationality: string | null
    city: string | null
    province: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
  }
  payment: {
    id: string
    status: string
    method: string | null
    amount: number
    transactionId: string
    checkoutUrl: string | null
    paidAt: string | null
    createdAt: string
  } | null
}

export const getEventParticipant = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      slug: z.string().min(1),
      participantId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const eventRow = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!eventRow) return null

    const row = await db.query.eventParticipant.findFirst({
      where: and(
        eq(eventParticipant.id, data.participantId),
        eq(eventParticipant.eventId, eventRow.id),
      ),
      with: {
        user: {
          with: {
            profile: true,
          },
        },
        category: true,
        group: true,
      },
    })
    if (!row) return null

    const latestPayment = await db.query.payment.findFirst({
      where: eq(payment.participantId, row.id),
      orderBy: [desc(payment.createdAt)],
    })

    const profile = row.user.profile
    const result: EventParticipantDetail = {
      id: row.id,
      status: row.status,
      bibNumber: row.bibNumber,
      jerseySize: row.jerseySize,
      price: row.price,
      serviceFee: row.serviceFee,
      currency: row.currency,
      promoCode: row.promoCode,
      discountAmount: row.discountAmount,
      finalPrice: row.finalPrice,
      createdAt: row.createdAt.toISOString(),
      event: {
        id: eventRow.id,
        name: eventRow.name,
        slug: eventRow.slug,
        kind: eventRow.kind as EventKind,
      },
      categoryName: row.category?.name ?? null,
      groupName: row.group?.name ?? null,
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        phone: profile?.phone ?? null,
        gender: profile?.gender ?? null,
        bloodType: profile?.bloodType ?? null,
        dateOfBirth: profile?.dateOfBirth ?? null,
        nationality: profile?.nationality ?? null,
        city: profile?.city ?? null,
        province: profile?.province ?? null,
        emergencyContactName: profile?.emergencyContactName ?? null,
        emergencyContactPhone: profile?.emergencyContactPhone ?? null,
      },
      payment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            method: latestPayment.method,
            amount: latestPayment.amount,
            transactionId: latestPayment.transactionId,
            checkoutUrl: latestPayment.checkoutUrl,
            paidAt: latestPayment.paidAt?.toISOString() ?? null,
            createdAt: latestPayment.createdAt.toISOString(),
          }
        : null,
    }

    return result
  })

export const deleteEventParticipant = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1),
      participantId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const eventRow = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!eventRow) {
      throw new Error('Event not found')
    }

    const row = await db.query.eventParticipant.findFirst({
      where: and(
        eq(eventParticipant.id, data.participantId),
        eq(eventParticipant.eventId, eventRow.id),
      ),
    })
    if (!row) {
      throw new Error('Participant not found')
    }

    await db.delete(eventParticipant).where(eq(eventParticipant.id, row.id))
    return { ok: true as const, eventSlug: eventRow.slug }
  })

export type EventCategoryRow = {
  id: string
  name: string
  description: string | null
  distance: string | null
  price: number
  serviceFee: number
  maxParticipants: number | null
  sortOrder: number
}

export const listEventCategories = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!row) return [] as EventCategoryRow[]

    const categories = await db.query.eventCategory.findMany({
      where: eq(eventCategory.eventId, row.id),
      orderBy: [asc(eventCategory.sortOrder), asc(eventCategory.name)],
    })

    return categories.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      distance: item.distance,
      price: item.price,
      serviceFee: item.serviceFee,
      maxParticipants: item.maxParticipants,
      sortOrder: item.sortOrder,
    }))
  })

const manageCategorySchema = categoryInputSchema.extend({
  slug: z.string().min(1),
})

export const createEventCategory = createServerFn({ method: 'POST' })
  .validator(manageCategorySchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: { categories: true },
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const isFree = row.kind === 'free'
    if (!isFree && data.price <= 0) {
      throw new Error('Paid and flagship categories need a price greater than 0')
    }

    const sortOrder =
      row.categories.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1

    await db.insert(eventCategory).values({
      id: crypto.randomUUID(),
      eventId: row.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      distance: data.distance.trim(),
      price: isFree ? 0 : data.price,
      serviceFee: isFree ? 0 : data.serviceFee,
      currency: 'IDR',
      maxParticipants: data.maxParticipants ?? null,
      sortOrder,
    })

    return { ok: true as const }
  })

export const updateEventCategory = createServerFn({ method: 'POST' })
  .validator(
    manageCategorySchema.extend({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: { categories: true },
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const existing = row.categories.find((item) => item.id === data.id)
    if (!existing) {
      throw new Error('Category not found')
    }

    const isFree = row.kind === 'free'
    if (!isFree && data.price <= 0) {
      throw new Error('Paid and flagship categories need a price greater than 0')
    }

    await db
      .update(eventCategory)
      .set({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        distance: data.distance.trim(),
        price: isFree ? 0 : data.price,
        serviceFee: isFree ? 0 : data.serviceFee,
        maxParticipants: data.maxParticipants ?? null,
        updatedAt: new Date(),
      })
      .where(eq(eventCategory.id, data.id))

    return { ok: true as const }
  })

export type EventGroupRow = {
  id: string
  eventSlug: string
  courseId: string
  categoryName: string | null
  name: string
  memberCount: number
}

export const listEventGroups = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!row) return [] as EventGroupRow[]

    const groups = await db.query.eventGroup.findMany({
      where: eq(eventGroup.eventId, row.id),
      with: {
        participants: true,
        category: true,
      },
      orderBy: [asc(eventGroup.name)],
    })

    return groups.map((group) => ({
      id: group.id,
      eventSlug: data.slug,
      courseId: group.eventCategoryId ?? '',
      categoryName: group.category?.name ?? null,
      name: group.name,
      memberCount: group.participants.length,
    }))
  })

export const createEventGroup = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      categoryId: z.string().min(1).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: { categories: true },
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const name = data.name.trim()
    if (!name) {
      throw new Error('Group name is required')
    }

    const categoryId = data.categoryId?.trim() || null
    if (
      categoryId &&
      !row.categories.some((item) => item.id === categoryId)
    ) {
      throw new Error('Category not found for this event')
    }

    const duplicate = await db.query.eventGroup.findFirst({
      where: and(eq(eventGroup.eventId, row.id), eq(eventGroup.name, name)),
    })
    if (duplicate) {
      throw new Error('A group with this name already exists')
    }

    await db.insert(eventGroup).values({
      id: crypto.randomUUID(),
      eventId: row.id,
      eventCategoryId: categoryId,
      name,
    })

    return { ok: true as const }
  })

export const updateEventGroup = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1),
      id: z.string().min(1),
      name: z.string().min(1),
      categoryId: z.string().min(1).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: {
        categories: true,
        groups: true,
      },
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const existing = row.groups.find((item) => item.id === data.id)
    if (!existing) {
      throw new Error('Group not found')
    }

    const name = data.name.trim()
    if (!name) {
      throw new Error('Group name is required')
    }

    const categoryId = data.categoryId?.trim() || null
    if (
      categoryId &&
      !row.categories.some((item) => item.id === categoryId)
    ) {
      throw new Error('Category not found for this event')
    }

    const duplicate = await db.query.eventGroup.findFirst({
      where: and(eq(eventGroup.eventId, row.id), eq(eventGroup.name, name)),
    })
    if (duplicate && duplicate.id !== data.id) {
      throw new Error('A group with this name already exists')
    }

    await db
      .update(eventGroup)
      .set({
        name,
        eventCategoryId: categoryId,
        updatedAt: new Date(),
      })
      .where(eq(eventGroup.id, data.id))

    return { ok: true as const }
  })

export const deleteEventGroup = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1),
      id: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: { groups: true },
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const existing = row.groups.find((item) => item.id === data.id)
    if (!existing) {
      throw new Error('Group not found')
    }

    await db.delete(eventGroup).where(eq(eventGroup.id, data.id))
    return { ok: true as const }
  })

export type EventPromoRow = {
  id: string
  promo: string
  discountValue: number
  discountType: string
  currency: string
  usageLimit: number | null
  usedCount: number
  isActive: boolean
}

export const listEventPromos = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!row) return [] as EventPromoRow[]

    const promos = await db.query.eventPromo.findMany({
      where: eq(eventPromo.eventId, row.id),
      orderBy: [asc(eventPromo.promo)],
    })

    return promos.map((item) => ({
      id: item.id,
      promo: item.promo,
      discountValue: item.discountValue,
      discountType: item.discountType,
      currency: item.currency,
      usageLimit: item.usageLimit,
      usedCount: item.usedCount,
      isActive: item.isActive,
    }))
  })

const managePromoSchema = z.object({
  slug: z.string().min(1),
  promo: z.string().min(1),
  discountValue: z.number().int().min(0),
  discountType: z.enum(['fixed', 'percent']),
  usageLimit: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
})

export const createEventPromo = createServerFn({ method: 'POST' })
  .validator(managePromoSchema)
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const code = data.promo.trim().toUpperCase()
    if (!code) {
      throw new Error('Promo code is required')
    }
    if (data.discountType === 'percent' && data.discountValue > 100) {
      throw new Error('Percent discount cannot exceed 100')
    }
    if (data.discountValue <= 0) {
      throw new Error('Discount must be greater than 0')
    }

    const duplicate = await db.query.eventPromo.findFirst({
      where: and(eq(eventPromo.eventId, row.id), eq(eventPromo.promo, code)),
    })
    if (duplicate) {
      throw new Error('A promo with this code already exists')
    }

    await db.insert(eventPromo).values({
      id: crypto.randomUUID(),
      eventId: row.id,
      promo: code,
      discountValue: data.discountValue,
      discountType: data.discountType,
      currency: 'IDR',
      usageLimit: data.usageLimit ?? null,
      usedCount: 0,
      isActive: data.isActive,
    })

    return { ok: true as const }
  })

export const updateEventPromo = createServerFn({ method: 'POST' })
  .validator(managePromoSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: { promos: true },
    })
    if (!row) {
      throw new Error('Event not found')
    }

    const existing = row.promos.find((item) => item.id === data.id)
    if (!existing) {
      throw new Error('Promo not found')
    }

    const code = data.promo.trim().toUpperCase()
    if (!code) {
      throw new Error('Promo code is required')
    }
    if (data.discountType === 'percent' && data.discountValue > 100) {
      throw new Error('Percent discount cannot exceed 100')
    }
    if (data.discountValue <= 0) {
      throw new Error('Discount must be greater than 0')
    }

    const duplicate = await db.query.eventPromo.findFirst({
      where: and(eq(eventPromo.eventId, row.id), eq(eventPromo.promo, code)),
    })
    if (duplicate && duplicate.id !== data.id) {
      throw new Error('A promo with this code already exists')
    }

    await db
      .update(eventPromo)
      .set({
        promo: code,
        discountValue: data.discountValue,
        discountType: data.discountType,
        usageLimit: data.usageLimit ?? null,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(eventPromo.id, data.id))

    return { ok: true as const }
  })

const registerForEventSchema = z.object({
  eventSlug: z.string().min(1),
  categoryId: z.string().optional(),
  groupId: z.string().optional(),
  groupName: z.string().optional(),
  jerseySize: z.string().optional(),
  status: z.enum(['draft', 'pending_payment', 'confirmed']).default('confirmed'),
})

export const registerForEvent = createServerFn({ method: 'POST' })
  .validator(registerForEventSchema)
  .handler(async ({ data }) => {
    const session = await requireSession()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.eventSlug),
      with: {
        categories: {
          orderBy: [asc(eventCategory.sortOrder)],
        },
      },
    })
    if (!row) {
      throw new Error('Event not found')
    }
    if (row.status !== 'open') {
      throw new Error('Registration is not open for this event')
    }

    const category =
      (data.categoryId
        ? row.categories.find((item) => item.id === data.categoryId)
        : undefined) ?? row.categories[0]
    if (!category) {
      throw new Error('Event has no category')
    }

    let groupId = data.groupId?.trim() || null
    const groupName = data.groupName?.trim() || null

    if (groupId) {
      const existingGroup = await db.query.eventGroup.findFirst({
        where: eq(eventGroup.id, groupId),
      })
      if (!existingGroup) {
        if (!groupName) {
          groupId = null
        } else {
          await db.insert(eventGroup).values({
            id: groupId,
            eventId: row.id,
            eventCategoryId: category.id,
            name: groupName,
          })
        }
      }
    } else if (groupName) {
      const byName = await db.query.eventGroup.findFirst({
        where: and(
          eq(eventGroup.eventId, row.id),
          eq(eventGroup.name, groupName),
        ),
      })
      if (byName) {
        groupId = byName.id
      } else {
        groupId = crypto.randomUUID()
        await db.insert(eventGroup).values({
          id: groupId,
          eventId: row.id,
          eventCategoryId: category.id,
          name: groupName,
        })
      }
    }

    const price = category.price
    const serviceFee = category.serviceFee
    const finalPrice = Math.max(0, price + serviceFee)
    const existing = await db.query.eventParticipant.findFirst({
      where: and(
        eq(eventParticipant.userId, session.user.id),
        eq(eventParticipant.eventId, row.id),
      ),
    })

    if (existing) {
      await db
        .update(eventParticipant)
        .set({
          eventCategoryId: category.id,
          eventGroupId: groupId,
          jerseySize: data.jerseySize?.trim() || null,
          status: data.status,
          price,
          serviceFee,
          currency: category.currency,
          finalPrice,
          updatedAt: new Date(),
        })
        .where(eq(eventParticipant.id, existing.id))
      return { id: existing.id, status: data.status }
    }

    const id = crypto.randomUUID()
    await db.insert(eventParticipant).values({
      id,
      userId: session.user.id,
      eventId: row.id,
      eventCategoryId: category.id,
      eventGroupId: groupId,
      jerseySize: data.jerseySize?.trim() || null,
      status: data.status,
      price,
      serviceFee,
      currency: category.currency,
      discountAmount: 0,
      finalPrice,
    })

    return { id, status: data.status }
  })
