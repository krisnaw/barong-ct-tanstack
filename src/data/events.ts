export type EventStatus = 'draft' | 'open' | 'closed'
export type EventKind = 'free' | 'paid' | 'flagship'
export type RegisterStep =
  | 'course'
  | 'group'
  | 'jersey'
  | 'profile'
  | 'payment'
  | 'done'
export type PaymentMethodChoice = 'qris_va' | 'card'

export const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

export type CourseOption = {
  id: string
  name: string
  distance: string
  elevation?: string
  description: string
  price: number
}

export type ClubEvent = {
  slug: string
  name: string
  date: string
  time: string
  location: string
  distance: string
  elevation?: string
  status: EventStatus
  kind: EventKind
  blurb: string
  description: string
  image: string
  imageAlt: string
  fee?: string
  feeAmount?: number
  capacity?: string
  registered?: string
  groupCapacity?: number
  hasJersey?: boolean
  courses?: CourseOption[]
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop`

export const events: ClubEvent[] = [
  {
    slug: 'barong-melali-2027',
    name: 'Barong Melali 2027',
    date: '28 August 2027',
    time: '04:00 WITA',
    location: 'UC Silver, Batubulan',
    distance: '145 km / 80 km',
    elevation: '~1,800 m',
    status: 'open',
    kind: 'flagship',
    blurb: 'Annual Melali — group, course, jersey size, then payment.',
    description:
      'Barong Melali returns as the club’s annual jalan-jalan across Gianyar. Long and short courses, a named group ride, and the same rule: keep the bunch together. Create a group, pick your course, choose a jersey size, then complete payment to lock your spot.',
    image: unsplash('photo-1471506480208-91b3a4cc78be'),
    imageAlt: 'A cyclist climbing an open country road toward the hills',
    fee: 'From Rp 300.000',
    feeAmount: 350_000,
    capacity: '400',
    registered: '86',
    groupCapacity: 8,
    hasJersey: true,
    courses: [
      {
        id: 'long',
        name: 'Long course',
        distance: '145 km',
        elevation: '~1,800 m',
        description: 'Sidemen, Besakih, Bukit Jambul — full Melali loop.',
        price: 350_000,
      },
      {
        id: 'short',
        name: 'Short course',
        distance: '80 km',
        elevation: '~900 m',
        description: 'Same start energy, earlier cut toward UC.',
        price: 300_000,
      },
    ],
  },
  {
    slug: 'climb-clinic-bedugul',
    name: 'Climb Clinic — Bedugul',
    date: '4 October 2026',
    time: '06:00 WITA',
    location: 'Bedugul meet point',
    distance: '70 km',
    elevation: '1,200 m',
    status: 'open',
    kind: 'paid',
    blurb: 'Coached climbing session — profile, then pay.',
    description:
      'A small paid clinic on the Bedugul ramps. Complete your rider profile and pay to hold a spot. No group ride, no kit — just the session fee.',
    image: unsplash('photo-1571068316344-75bc76f77890'),
    imageAlt: 'A road cyclist climbing a steep forested hill',
    fee: 'Rp 150.000',
    feeAmount: 150_000,
    capacity: '24',
    registered: '11',
  },
  {
    slug: 'saturday-climax-kintamani',
    name: 'Saturday Climax — Kintamani',
    date: '12 September 2026',
    time: '05:30 WITA',
    location: 'Denpasar meet point',
    distance: '100 km',
    elevation: '1,000 m+',
    status: 'open',
    kind: 'free',
    blurb: 'Weekly long ride up to the crater rim.',
    description:
      'The Saturday Climax rolls toward Kintamani with regroups on the climb. Social pace at the front of the bunch — no racing. Bring lights, bottles, and cash for coffee at the top.',
    image: unsplash('photo-1517649763962-0c623066013b'),
    imageAlt: 'Road cyclists packed in a peloton on an open country road',
    fee: 'Free',
    feeAmount: 0,
    capacity: '60',
    registered: '24',
  },
  {
    slug: 'thursday-foreplay',
    name: 'Thursday Foreplay',
    date: '10 September 2026',
    time: '05:45 WITA',
    location: 'Denpasar meet point',
    distance: '60 km',
    status: 'open',
    kind: 'free',
    blurb: 'Midweek social — the bunch stays together.',
    description:
      'Foreplay is the midweek social spin. Easy pace, no drop, coffee stop optional. Ideal if you are new to the club or easing back after time off the bike.',
    image: unsplash('photo-1541625602330-2277a4c46182'),
    imageAlt: 'Two cyclists riding together on a coastal road',
    fee: 'Free',
    feeAmount: 0,
    capacity: '40',
    registered: '18',
  },
]

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug)
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
  return ['profile', 'done']
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
