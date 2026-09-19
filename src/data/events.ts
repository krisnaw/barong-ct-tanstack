export type EventStatus = 'draft' | 'open' | 'closed'
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
  isGroupRide?: boolean
  courses?: CourseOption[]
  categoryId?: string
  categoryName?: string
  serviceFeeAmount?: number
  eventDate?: string
  eventTime?: string
  timeZone?: string
  registrationClosesAt?: string
}

export function eventImageSrc(image: string, width: number) {
  const separator = image.includes('?') ? '&' : '?'
  return `${image}${separator}w=${width}&q=75`
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

export function stepsForKind(kind: EventKind): RegisterStep[] {
  if (kind === 'flagship') {
    return ['group', 'course', 'jersey', 'profile', 'payment']
  }
  if (kind === 'paid') {
    return ['profile', 'payment']
  }
  return ['profile']
}

export function firstStepForKind(kind: EventKind): RegisterStep {
  return stepsForKind(kind)[0] ?? 'profile'
}

export function eventEntryAmount(event: ClubEvent, courseId?: string) {
  if (event.kind === 'flagship') {
    const course = event.courses?.find((item) => item.id === courseId)
    return course?.price ?? 0
  }
  return event.feeAmount ?? 0
}

export function registerCtaCopy(kind: EventKind) {
  if (kind === 'flagship') {
    return 'Next: group, course, jersey size, profile, then payment.'
  }
  if (kind === 'paid') {
    return 'Complete your profile, then pay to confirm.'
  }
  return 'Confirm your details to join the ride.'
}
