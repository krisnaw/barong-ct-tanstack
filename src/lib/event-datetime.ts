const GMT_OFFSET = /^GMT([+-])(\d{1,2})$/i

export function eventTimeZoneOffsetMinutes(timeZone?: string): number {
  const match = timeZone?.trim().match(GMT_OFFSET)
  if (!match) return 8 * 60
  const sign = match[1] === '-' ? -1 : 1
  return sign * Number(match[2]) * 60
}

/** IANA zone for a stored GMT±N label (Etc/GMT uses inverted signs). */
export function eventTimeZoneToIana(timeZone?: string): string {
  const hours = eventTimeZoneOffsetMinutes(timeZone) / 60
  if (hours === 0) return 'UTC'
  const sign = hours > 0 ? '-' : '+'
  return `Etc/GMT${sign}${Math.abs(hours)}`
}

/**
 * Absolute instant for an event's wall-clock date/time in its stored zone.
 * `event_date` + `event_time` are local to `time_zone`, not UTC.
 */
export function eventInstant(
  eventDate?: string,
  eventTime?: string,
  timeZone?: string,
): Date | null {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}/.test(eventDate)) return null
  const datePart = eventDate.slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  const timeMatch = (eventTime ?? '00:00').match(/(\d{1,2}):(\d{2})/)
  const hour = timeMatch ? Number(timeMatch[1]) : 0
  const minute = timeMatch ? Number(timeMatch[2]) : 0
  if (
    [year, month, day, hour, minute].some((value) => Number.isNaN(value)) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }
  const offsetMs = eventTimeZoneOffsetMinutes(timeZone) * 60_000
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMs)
}

/** Calendar date only, stable across runtimes (no UTC day-shift). */
export function formatEventDateLabel(eventDate?: string): string {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}/.test(eventDate)) {
    return eventDate?.trim() || ''
  }
  const [year, month, day] = eventDate.slice(0, 10).split('-').map(Number)
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12))
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcNoon)
}

export type EventWhenParts = {
  date: string
  time: string
}

/**
 * Dashboard-style when:
 * date → `Saturday, 29 August 2026`
 * time → `5:00 am GMT+8`
 */
export function formatEventWhenParts(
  eventDate?: string,
  eventTime?: string,
  timeZone?: string,
): EventWhenParts {
  const zoneLabel = timeZone?.trim() || 'GMT+8'
  const instant = eventInstant(eventDate, eventTime, timeZone)

  if (!instant) {
    const dateFallback = formatWeekdayDateLabel(eventDate)
    const timeFallback = eventTime?.trim()
      ? formatWallClockAmPm(eventTime)
      : ''
    return {
      date: dateFallback,
      time: timeFallback ? `${timeFallback} ${zoneLabel}` : zoneLabel,
    }
  }

  const iana = eventTimeZoneToIana(timeZone)
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: iana,
  }).format(instant)

  const timeCore = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: iana,
  })
    .format(instant)
    .replace(/\s?(AM|PM)/i, (_, period: string) => ` ${period.toLowerCase()}`)

  return {
    date,
    time: `${timeCore} ${zoneLabel}`,
  }
}

function formatWeekdayDateLabel(eventDate?: string): string {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}/.test(eventDate)) {
    return eventDate?.trim() || ''
  }
  const [year, month, day] = eventDate.slice(0, 10).split('-').map(Number)
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12))
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcNoon)
}

function formatWallClockAmPm(eventTime: string): string {
  const match = eventTime.match(/(\d{1,2}):(\d{2})/)
  if (!match) return eventTime.trim()
  const hour24 = Number(match[1])
  const minute = match[2]
  const period = hour24 >= 12 ? 'pm' : 'am'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${minute} ${period}`
}
