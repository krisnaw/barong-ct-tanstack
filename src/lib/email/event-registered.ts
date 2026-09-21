import { render } from '@react-email/render'
import { eq } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { formatIdr } from '~/data/events'
import {
  EventRegistered,
  eventRegisteredEmailCopy,
} from '~/emails/event-registered'
import { db } from '~/lib/db'
import { sendEmail } from '~/lib/email/send'
import { eventParticipant } from '~/lib/event-schema'

function publicBaseUrl() {
  return (env.BETTER_AUTH_URL || 'https://barongcycling.com').replace(/\/$/, '')
}

function formatEventDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

export async function sendEventRegisteredEmail(participantId: string) {
  const row = await db.query.eventParticipant.findFirst({
    where: eq(eventParticipant.id, participantId),
    with: {
      event: true,
      category: true,
      group: true,
      user: {
        with: {
          profile: true,
        },
      },
    },
  })
  if (!row?.event || !row.user) return

  const event = row.event
  const profile = row.user.profile
  const firstName =
    profile?.firstName?.trim() || row.user.name.trim().split(/\s+/)[0] || ''
  const baseUrl = publicBaseUrl()
  const eventUrl = `${baseUrl}/events/${event.slug}`
  const details = [
    row.category
      ? {
          label: 'Category',
          value: row.category.distance
            ? `${row.category.name} · ${row.category.distance}`
            : row.category.name,
        }
      : null,
    row.group ? { label: 'Group', value: row.group.name } : null,
    row.jerseySize
      ? { label: 'Jersey', value: row.jerseySize.toUpperCase() }
      : null,
    row.promoCode && row.discountAmount > 0
      ? {
          label: 'Promo',
          value: `${row.promoCode} (−${formatIdr(row.discountAmount)})`,
        }
      : null,
    row.bibNumber ? { label: 'Bib', value: `#${row.bibNumber}` } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item))

  const copy = eventRegisteredEmailCopy({
    eventName: event.name,
    isPaid: row.finalPrice > 0,
  })
  const element = EventRegistered({
    companyName: 'Barong',
    logoUrl: `${baseUrl}/barong_logo.png`,
    firstName,
    eventName: event.name,
    eventDate: formatEventDate(event.eventDate),
    eventTime: `${event.eventTime} ${event.timeZone}`.trim(),
    location: event.locationName,
    details,
    totalLabel: row.finalPrice > 0 ? 'Paid' : 'Entry',
    totalValue: row.finalPrice > 0 ? formatIdr(row.finalPrice) : 'Free',
    eventUrl,
    isPaid: row.finalPrice > 0,
  })
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  await sendEmail({
    to: {
      email: row.user.email,
      name:
        `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() ||
        row.user.name,
    },
    subject: copy.subject,
    html,
    text,
  })
}
