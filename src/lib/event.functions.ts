import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { asc, desc, eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from 'db'
import {
  event,
  eventCategory,
  eventGroup,
  eventParticipant,
  eventPromo,
} from 'db/schemas/event'
import { payment } from 'db/schemas/order'
import {
  type ClubEvent,
  type CourseOption,
  type EventKind,
  type EventStatus,
  formatIdr,
} from '~/data/events'
import { auth } from '~/lib/auth'
import { hasAdminRole } from '~/lib/auth.functions'
import { normalizeStoredImageRef } from '~/lib/catalogue-image'
import { sendEventRegisteredEmail } from '~/lib/email/event-registered'
import { formatEventDateLabel } from '~/lib/event-datetime'
import { stripHtml } from '~/lib/rich-html'

const eventKindSchema = z.enum(['free', 'paid', 'flagship'])
const eventStatusSchema = z.enum(['draft', 'open', 'closed', 'archived'])

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
})

const updateEventSchema = createEventSchema.extend({
  id: z.string().min(1),
  status: eventStatusSchema,
})

type EventRow = typeof event.$inferSelect
type CategoryRow = typeof eventCategory.$inferSelect

function blurbFromDescription(description: string) {
  const trimmed = stripHtml(description)
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
    serviceFee: row.serviceFee,
    maxParticipants: row.maxParticipants,
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
    date: formatEventDateLabel(row.eventDate),
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
    image: (() => {
      const feature = row.featureImage?.trim()
      if (!feature) {
        return 'https://images.unsplash.com/photo-1517649763962-0c623066027e?auto=format&fit=crop'
      }
      return normalizeStoredImageRef(feature)
    })(),
    imageAlt: row.featureImageAlt?.trim() || row.name,
    featureImage: row.featureImage
      ? normalizeStoredImageRef(row.featureImage)
      : row.featureImage,
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
  if (!includeDraft && (row.status === 'draft' || row.status === 'archived')) {
    return null
  }
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
        if (!includeDraft) {
          return row.status === 'open' || row.status === 'closed'
        }
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

    const id = crypto.randomUUID()

    await db.insert(event).values({
      id,
      slug,
      name: data.name.trim(),
      description: data.description.trim(),
      regulation: data.regulation?.trim() || null,
      featureImage: data.featureImage?.trim()
        ? normalizeStoredImageRef(data.featureImage)
        : null,
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
      groupCapacity: data.isGroupRide ? (data.groupCapacity ?? null) : null,
    })

    if (data.kind === 'free') {
      await db.insert(eventCategory).values({
        id: crypto.randomUUID(),
        eventId: id,
        name: 'Free Ride',
        description: null,
        distance: null,
        price: 0,
        serviceFee: 0,
        currency: 'IDR',
        maxParticipants: null,
        sortOrder: 0,
      })
    }

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

    await db
      .update(event)
      .set({
        slug: nextSlug,
        name: data.name.trim(),
        description: data.description.trim(),
        regulation: data.regulation?.trim() || null,
        featureImage: data.featureImage?.trim()
          ? normalizeStoredImageRef(data.featureImage)
          : null,
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

const participantStatusSchema = z.enum([
  'draft',
  'pending_payment',
  'confirmed',
  'cancelled',
])

export type EventParticipantDetail = {
  id: string
  status: string
  bibNumber: string | null
  jerseySize: string | null
  categoryId: string | null
  groupId: string | null
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
    hasJersey: boolean
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
      categoryId: row.eventCategoryId,
      groupId: row.eventGroupId,
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
        hasJersey: eventRow.hasJersey,
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

export const updateEventParticipant = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1),
      participantId: z.string().min(1),
      status: participantStatusSchema,
      jerseySize: z.string().nullable().optional(),
      bibNumber: z.string().nullable().optional(),
      categoryId: z.string().nullable().optional(),
      groupId: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const eventRow = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: {
        categories: true,
        groups: true,
      },
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

    const categoryId =
      data.categoryId === undefined
        ? row.eventCategoryId
        : data.categoryId?.trim() || null
    const groupId =
      data.groupId === undefined
        ? row.eventGroupId
        : data.groupId?.trim() || null

    const category = categoryId
      ? eventRow.categories.find((item) => item.id === categoryId)
      : null
    if (categoryId && !category) {
      throw new Error('Category not found for this event')
    }

    const group = groupId
      ? eventRow.groups.find((item) => item.id === groupId)
      : null
    if (groupId && !group) {
      throw new Error('Group not found for this event')
    }
    if (
      group &&
      group.eventCategoryId &&
      categoryId &&
      group.eventCategoryId !== categoryId
    ) {
      throw new Error('Group does not belong to the selected category')
    }

    const jerseySize =
      data.jerseySize === undefined
        ? row.jerseySize
        : data.jerseySize?.trim().toUpperCase() || null
    const bibNumber =
      data.bibNumber === undefined
        ? row.bibNumber
        : data.bibNumber?.trim() || null

    const categoryChanged = categoryId !== row.eventCategoryId
    const price = categoryChanged && category ? category.price : row.price
    const serviceFee =
      categoryChanged && category ? category.serviceFee : row.serviceFee
    const finalPrice = Math.max(0, price + serviceFee - row.discountAmount)
    const wasConfirmed = row.status === 'confirmed'

    await db
      .update(eventParticipant)
      .set({
        status: data.status,
        jerseySize,
        bibNumber,
        eventCategoryId: categoryId,
        eventGroupId: groupId,
        price,
        serviceFee,
        finalPrice,
        updatedAt: new Date(),
      })
      .where(eq(eventParticipant.id, row.id))

    if (data.status === 'confirmed' && !wasConfirmed) {
      try {
        await sendEventRegisteredEmail(row.id)
      } catch (error) {
        console.error('Failed to send event registration email', error)
      }
    }

    return { ok: true as const }
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
      discountType: isPercentDiscountType(item.discountType)
        ? 'percent'
        : 'fixed',
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

type PromoRow = typeof eventPromo.$inferSelect

function computePromoDiscount(promo: PromoRow, entryPrice: number) {
  if (entryPrice <= 0 || promo.discountValue <= 0) return 0
  if (isPercentDiscountType(promo.discountType)) {
    return Math.min(
      entryPrice,
      Math.round((entryPrice * promo.discountValue) / 100),
    )
  }
  return Math.min(entryPrice, promo.discountValue)
}

function isPercentDiscountType(type: string) {
  const normalized = type.trim().toLowerCase()
  return normalized === 'percent' || normalized === 'percentage'
}

function assertPromoUsable(promo: PromoRow, now = new Date()) {
  if (!promo.isActive) {
    throw new Error('This promo code is not active')
  }
  if (promo.startsAt && promo.startsAt > now) {
    throw new Error('This promo code is not active yet')
  }
  if (promo.endsAt && promo.endsAt < now) {
    throw new Error('This promo code has expired')
  }
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    throw new Error('This promo code has reached its usage limit')
  }
}

async function resolveEventPromo(input: {
  eventId: string
  code: string
  entryPrice: number
}) {
  const code = input.code.trim().toUpperCase()
  if (!code) {
    return {
      promoId: null as string | null,
      promoCode: null as string | null,
      discountAmount: 0,
    }
  }

  const promo = await db.query.eventPromo.findFirst({
    where: and(eq(eventPromo.eventId, input.eventId), eq(eventPromo.promo, code)),
  })
  if (!promo) {
    throw new Error('Invalid promo code')
  }
  assertPromoUsable(promo)
  const discountAmount = computePromoDiscount(promo, input.entryPrice)
  if (discountAmount <= 0) {
    throw new Error('This promo code does not apply to this category')
  }

  return {
    promoId: promo.id,
    promoCode: promo.promo,
    discountAmount,
  }
}

export const validateEventPromo = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      slug: z.string().min(1),
      code: z.string().min(1),
      categoryId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSession()
    const row = await db.query.event.findFirst({
      where: eq(event.slug, data.slug),
      with: {
        categories: {
          orderBy: [asc(eventCategory.sortOrder)],
        },
      },
    })
    if (!row) {
      throw new Error('Event not found')
    }
    if (row.kind === 'free') {
      throw new Error('Promo codes are only for paid events')
    }

    const category =
      (data.categoryId
        ? row.categories.find((item) => item.id === data.categoryId)
        : undefined) ?? row.categories[0]
    if (!category) {
      throw new Error('Event has no category')
    }

    const resolved = await resolveEventPromo({
      eventId: row.id,
      code: data.code,
      entryPrice: category.price,
    })

    return {
      promo: resolved.promoCode!,
      discountAmount: resolved.discountAmount,
      entryPrice: category.price,
      serviceFee: category.serviceFee,
      total: Math.max(
        0,
        category.price + category.serviceFee - resolved.discountAmount,
      ),
    }
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
  promoCode: z.string().optional(),
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
    const promo = await resolveEventPromo({
      eventId: row.id,
      code: data.promoCode ?? '',
      entryPrice: price,
    })
    const finalPrice = Math.max(0, price + serviceFee - promo.discountAmount)
    const existing = await db.query.eventParticipant.findFirst({
      where: and(
        eq(eventParticipant.userId, session.user.id),
        eq(eventParticipant.eventId, row.id),
      ),
    })

    if (existing) {
      const wasConfirmed = existing.status === 'confirmed'
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
          promoId: promo.promoId,
          promoCode: promo.promoCode,
          discountAmount: promo.discountAmount,
          finalPrice,
          updatedAt: new Date(),
        })
        .where(eq(eventParticipant.id, existing.id))
      if (data.status === 'confirmed' && !wasConfirmed) {
        try {
          await sendEventRegisteredEmail(existing.id)
        } catch (error) {
          console.error('Failed to send event registration email', error)
        }
      }
      return { id: existing.id, status: data.status, finalPrice }
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
      promoId: promo.promoId,
      promoCode: promo.promoCode,
      discountAmount: promo.discountAmount,
      finalPrice,
    })

    if (data.status === 'confirmed') {
      try {
        await sendEventRegisteredEmail(id)
      } catch (error) {
        console.error('Failed to send event registration email', error)
      }
    }

    return { id, status: data.status, finalPrice }
  })
