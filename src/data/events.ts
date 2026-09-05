export type PastEvent = {
  slug: string
  name: string
  year: string
  date: string
  location: string
  distance: string
  highlight: string
  blurb: string
  image: string
  imageAlt: string
  featured?: boolean
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
    image: unsplash('photo-1471506480208-91b3a4cc78be'),
    imageAlt: 'A cyclist climbing an open country road toward the hills',
    featured: true,
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
    image: unsplash('photo-1541625602330-2277a4c46182'),
    imageAlt: 'Two cyclists riding together on a coastal road',
  },
]

export function getPastEvent(slug: string) {
  return pastEvents.find((event) => event.slug === slug)
}
