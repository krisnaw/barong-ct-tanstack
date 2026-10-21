export type EventStatus = 'draft' | 'open' | 'closed' | 'archived'
export type EventKind = 'free' | 'paid' | 'flagship'
export type RegisterStep =
  | 'course'
  | 'group'
  | 'jersey'
  | 'profile'
  | 'payment'
export type PaymentMethodChoice = 'qris_va' | 'card'

export const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

export type CourseOption = {
  id: string
  name: string
  distance: string
  elevation?: string
  description: string
  price: number
  serviceFee?: number
  maxParticipants?: number | null
}

export type ClubEvent = {
  id?: string
  slug: string
  name: string
  date: string
  time: string
  location: string
  locationAddress?: string
  distance: string
  elevation?: string
  status: EventStatus
  kind: EventKind
  blurb: string
  description: string
  regulation?: string
  image: string
  imageAlt: string
  featureImage?: string | null
  fee?: string
  feeAmount?: number
  capacity?: string
  registered?: string
  groupCapacity?: number
  hasJersey?: boolean
  sizeChartImage?: string
  jerseyImage?: string
  isGroupRide?: boolean
  hasCharity?: boolean
  charityInfo?: string
  courses?: CourseOption[]
  categoryId?: string
  categoryName?: string
  serviceFeeAmount?: number
  eventDate?: string
  eventTime?: string
  timeZone?: string
  registrationClosesAt?: string
}

function eventImageHref(image: string) {
  const trimmed = image.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.pathname.startsWith('/api/catalogue-images/')) {
      return url.pathname
    }
  } catch {
    // keep original
  }
  return trimmed
}

export function eventImageSrc(image: string, width: number) {
  const href = eventImageHref(image)
  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}w=${width}&q=75`
}

export function formatIdr(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/Rp\s+/, 'Rp')
}

export function stepsForEvent(event: Pick<ClubEvent, 'kind' | 'hasJersey'>): RegisterStep[] {
  if (event.kind === 'flagship') {
    return ['group', 'course', 'jersey', 'profile', 'payment']
  }
  if (event.kind === 'paid') {
    return event.hasJersey
      ? ['jersey', 'profile', 'payment']
      : ['profile', 'payment']
  }
  return ['profile']
}

export function firstStepForEvent(
  event: Pick<ClubEvent, 'kind' | 'hasJersey'>,
): RegisterStep {
  return stepsForEvent(event)[0] ?? 'profile'
}

export function eventEntryAmount(event: ClubEvent, courseId?: string) {
  if (event.kind === 'flagship') {
    const course = event.courses?.find((item) => item.id === courseId)
    return course?.price ?? 0
  }
  return event.feeAmount ?? 0
}

export function registerCtaCopy(event: Pick<ClubEvent, 'kind' | 'hasJersey'>) {
  if (event.kind === 'flagship') {
    return 'Next: group, course, jersey size, profile, then payment.'
  }
  if (event.kind === 'paid') {
    return event.hasJersey
      ? 'Pick a jersey size, complete your profile, then pay to confirm.'
      : 'Complete your profile, then pay to confirm.'
  }
  return 'Confirm your details to join the ride.'
}
