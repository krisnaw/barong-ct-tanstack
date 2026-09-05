export type EventStat = {
  label: string
  value: string
}

export type EventTestimonial = {
  quote: string
  name: string
  role: string
  club: string
  image: string
  imageAlt: string
}

export type EventPhoto = {
  image: string
  imageAlt: string
  caption: string
  span?: 'wide' | 'tall' | 'square'
}

export type PastEvent = {
  slug: string
  name: string
  year: string
  date: string
  location: string
  distance: string
  highlight: string
  blurb: string
  summary: string
  image: string
  imageAlt: string
  featured?: boolean
  stats: EventStat[]
  photos: EventPhoto[]
  testimonials: EventTestimonial[]
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop`

export const pastEvents: PastEvent[] = [
  {
    slug: 'barong-melali-2026',
    name: 'Barong Melali 2026',
    year: '2026',
    date: '29 August 2026',
    location: 'UC Silver, Batubulan',
    distance: '140.5 km',
    highlight: '335 riders · 73 clubs',
    blurb: 'Long route through Sidemen, Besakih, and Bukit Jambul. Not a race.',
    summary:
      'Three hundred thirty-five riders from seventy-three clubs rolled out of UC Silver before sunrise. The long route threaded Sidemen, Besakih, and Bukit Jambul — a jalan-jalan across Gianyar, not a race.',
    image: unsplash('photo-1471506480208-91b3a4cc78be'),
    imageAlt: 'A cyclist climbing an open country road toward the hills',
    featured: true,
    stats: [
      { label: 'Distance', value: '140.5 km' },
      { label: 'Riders', value: '335' },
      { label: 'Clubs', value: '73' },
      { label: 'Start', value: '04:00' },
      { label: 'Routes', value: '2' },
      { label: 'Finish', value: 'UC Silver' },
    ],
    photos: [
      {
        image: unsplash('photo-1517649763962-0c623066013b'),
        imageAlt: 'A dense peloton rolling on an open road',
        caption: 'Neutral start — still bunched before the climbs.',
        span: 'wide',
      },
      {
        image: unsplash('photo-1485965120184-e220f721d03e'),
        imageAlt: 'Road bike leaning against a roadside barrier',
        caption: 'Machine check at the first regroup.',
        span: 'square',
      },
      {
        image: unsplash('photo-1571068316344-75bc76f77890'),
        imageAlt: 'Cyclists riding through green countryside',
        caption: 'Sidemen rice fields after the early rollers.',
        span: 'square',
      },
      {
        image: unsplash('photo-1558618666-fcd25c85cd64'),
        imageAlt: 'Cyclists climbing a mountain road',
        caption: 'Besakih climb in the cloud line.',
        span: 'square',
      },
      {
        image: unsplash('photo-1534787238916-9ba6764efd4f'),
        imageAlt: 'Solo cyclist on a forest road',
        caption: 'Quiet stretch before Bukit Jambul.',
        span: 'square',
      },
      {
        image: unsplash('photo-1459865264687-595d652de67e'),
        imageAlt: 'Cyclists gathered at an outdoor finish area',
        caption: 'Finish smiles back at UC Silver.',
        span: 'wide',
      },
    ],
    testimonials: [
      {
        quote:
          'Besakih in the mist, then Bukit Jambul with the bunch still together. That is Melali — you wait, you climb, you laugh at the top.',
        name: 'Gede Riza',
        role: 'Ride marshal',
        club: 'Barong Cycling Team',
        image: unsplash('photo-1506794778202-cad84cf45f1d'),
        imageAlt: 'Portrait of a man outdoors',
      },
      {
        quote:
          'We came from Jakarta for the long route. No one was racing. Someone always waited at the regroup. That stuck with us.',
        name: 'Ayu Prameswari',
        role: 'Guest rider',
        club: 'Jakarta Road Club',
        image: unsplash('photo-1494790108377-be9c29b29330'),
        imageAlt: 'Portrait of a woman smiling',
      },
      {
        quote:
          'Safety first, scenery second, ego last. Melali still feels like a family ride even with three hundred on the road.',
        name: 'Ketut Duarsa',
        role: 'Club chair',
        club: 'Barong Cycling Team',
        image: unsplash('photo-1507003211169-0a1dd7228f2d'),
        imageAlt: 'Portrait of a man in soft light',
      },
    ],
  },
  {
    slug: 'barong-melali-2025',
    name: 'Barong Melali 2025',
    year: '2025',
    date: '30 August 2025',
    location: 'UC Batubulan',
    distance: '137.3 km',
    highlight: '1,779 m climbing · No Solo Rider',
    blurb: 'The first Melali from UC — ride it with a partner, not alone.',
    summary:
      'The first Melali staged from UC Batubulan asked every rider to bring a partner. One hundred thirty-seven kilometres and nearly eighteen hundred metres of climbing — still not a race.',
    image: unsplash('photo-1541625602330-2277a4c46182'),
    imageAlt: 'Two cyclists riding together on a coastal road',
    stats: [
      { label: 'Distance', value: '137.3 km' },
      { label: 'Climbing', value: '1,779 m' },
      { label: 'Format', value: 'No Solo' },
      { label: 'Start', value: 'UC Batubulan' },
      { label: 'Partners', value: 'Required' },
      { label: 'Vibe', value: 'Social' },
    ],
    photos: [
      {
        image: unsplash('photo-1541625602330-2277a4c46182'),
        imageAlt: 'Two cyclists riding side by side on a coastal road',
        caption: 'No Solo Rider — pairs rolling out together.',
        span: 'wide',
      },
      {
        image: unsplash('photo-1507035895480-2b3156c31fc8'),
        imageAlt: 'Cyclist riding along a scenic mountain road',
        caption: 'Long climb with a partner on the wheel.',
        span: 'square',
      },
      {
        image: unsplash('photo-1485965120184-e220f721d03e'),
        imageAlt: 'Road bike detail at the roadside',
        caption: 'Bottles filled, kit sorted, ready for UC.',
        span: 'square',
      },
      {
        image: unsplash('photo-1558611848-73f7eb4001a1'),
        imageAlt: 'Group of road cyclists on a sunny day',
        caption: 'Mid-ride regroup under the midday sun.',
        span: 'square',
      },
      {
        image: unsplash('photo-1571068316344-75bc76f77890'),
        imageAlt: 'Cyclists riding through open countryside',
        caption: 'Quiet kilometres before the last climb.',
        span: 'square',
      },
      {
        image: unsplash('photo-1517649763962-0c623066013b'),
        imageAlt: 'Peloton packing the road',
        caption: 'Coffee and stories after the finish.',
        span: 'wide',
      },
    ],
    testimonials: [
      {
        quote:
          'No Solo Rider meant I had to look after someone else. We finished slower, and it was the best Melali I have done.',
        name: 'Made Wirawan',
        role: 'Regular rider',
        club: 'Barong Cycling Team',
        image: unsplash('photo-1472099645785-5658abf4ff4e'),
        imageAlt: 'Portrait of a man looking at the camera',
      },
      {
        quote:
          'UC as start and finish made the day feel like a proper festival. Coffee after, stories before the legs cooled down.',
        name: 'Sari Lestari',
        role: 'Guest rider',
        club: 'Bandung Peloton',
        image: unsplash('photo-1438761681033-6461ffad8d80'),
        imageAlt: 'Portrait of a woman outdoors',
      },
      {
        quote:
          'Seventeen hundred metres with a partner on your wheel. Melali 2025 proved the club can host a big day without losing the soul.',
        name: 'Bagus Kharisma',
        role: 'Ride leader',
        club: 'Barong Cycling Team',
        image: unsplash('photo-1519345182560-3f2917c472ef'),
        imageAlt: 'Portrait of a man in natural light',
      },
    ],
  },
]

export function getPastEvent(slug: string) {
  return pastEvents.find((event) => event.slug === slug)
}
