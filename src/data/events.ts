export type EventStatus = 'open' | 'closed' | 'upcoming'
export type RegistrationType = 'full' | 'simple'

export type JerseyOption = {
  id: string
  name: string
  description: string
  sizes: string[]
}

export type RouteOption = {
  id: string
  name: string
  distance: string
  elevation?: string
  description: string
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
  registration: RegistrationType
  blurb: string
  description: string
  image: string
  imageAlt: string
  fee?: string
  feeAmount?: number
  capacity?: string
  registered?: string
  jerseys?: JerseyOption[]
  routes?: RouteOption[]
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
    registration: 'full',
    blurb: 'Annual Melali — jersey, route, and payment required.',
    description:
      'Barong Melali returns as the club’s annual jalan-jalan across Gianyar. Long and short routes, neutral start, and the same rule: keep the bunch together. Pick your jersey and route, then complete payment to lock your spot.',
    image: unsplash('photo-1471506480208-91b3a4cc78be'),
    imageAlt: 'A cyclist climbing an open country road toward the hills',
    fee: 'Rp 350.000',
    feeAmount: 350_000,
    capacity: '400',
    registered: '86',
    jerseys: [
      {
        id: 'classic-black',
        name: 'Classic Black',
        description: 'Club kit — black body, white Barong mark.',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
      {
        id: 'melali-white',
        name: 'Melali White',
        description: 'Event special — white with ink typography.',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
    ],
    routes: [
      {
        id: 'long',
        name: 'Long route',
        distance: '145 km',
        elevation: '~1,800 m',
        description: 'Sidemen, Besakih, Bukit Jambul — full Melali loop.',
      },
      {
        id: 'short',
        name: 'Short route',
        distance: '80 km',
        elevation: '~900 m',
        description: 'Same start energy, earlier cut toward UC.',
      },
    ],
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
    registration: 'simple',
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
    registration: 'simple',
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
