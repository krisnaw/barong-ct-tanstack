import { formatIdr } from '~/data/events'

export type BikeCategory = 'road' | 'gravel' | 'mountain'

export type BikeAvailability = 'available' | 'limited' | 'booked'

export type RentalBike = {
  id: string
  name: string
  category: BikeCategory
  groupset: string
  wheels: string
  sizes: string[]
  dailyRate: number
  availability: BikeAvailability
  remaining: number | null
  summary: string
  image: string
  imageAlt: string
}

export const bikeCategoryLabels: Record<BikeCategory, string> = {
  road: 'Road',
  gravel: 'Gravel',
  mountain: 'Mountain',
}

export const pickupTimes = ['05:15', '05:30', '05:45', '06:00', '06:15']

export const rentalBikes: RentalBike[] = [
  {
    id: 'domane-al-5',
    name: 'Trek Domane AL 5',
    category: 'road',
    groupset: 'Shimano 105',
    wheels: 'Alloy, 32 mm clearance',
    sizes: ['52', '54', '56', '58'],
    dailyRate: 250_000,
    availability: 'available',
    remaining: 2,
    summary:
      'Alloy endurance bike for guests joining the Tuesday and Thursday road rides.',
    image: '/bikes/domane.jpg',
    imageAlt: 'Black road bike in profile',
  },
  {
    id: 'endurace-cf',
    name: 'Canyon Endurace CF',
    category: 'road',
    groupset: 'Shimano Ultegra',
    wheels: 'Carbon, 30 mm tyres',
    sizes: ['51', '54', '56', '58'],
    dailyRate: 450_000,
    availability: 'limited',
    remaining: 1,
    summary: 'Lighter carbon option for a full-day Melali or a climb toward Kintamani.',
    image: '/bikes/endurace.jpg',
    imageAlt: 'Rider on a black carbon road bike',
  },
  {
    id: 'roubaix',
    name: 'Specialized Roubaix',
    category: 'road',
    groupset: 'Shimano 105',
    wheels: 'Carbon, 32 mm tyres',
    sizes: ['52', '54', '56'],
    dailyRate: 350_000,
    availability: 'booked',
    remaining: 0,
    summary: 'Comfort-focused road bike. Currently out with a visiting rider.',
    image: '/bikes/roubaix.jpg',
    imageAlt: 'Black carbon road bike with deep-section wheels',
  },
  {
    id: 'topstone',
    name: 'Cannondale Topstone',
    category: 'gravel',
    groupset: 'Shimano GRX',
    wheels: 'Alloy, 40 mm tyres',
    sizes: ['S', 'M', 'L'],
    dailyRate: 300_000,
    availability: 'available',
    remaining: 2,
    summary: 'Gravel bike for the north-coast paths and the Saturday mixed-surface ride.',
    image: '/bikes/topstone.jpg',
    imageAlt: 'Brown gravel bike with tan-wall tyres',
  },
  {
    id: 'revolt',
    name: 'Giant Revolt',
    category: 'gravel',
    groupset: 'Shimano GRX',
    wheels: 'Alloy, 45 mm tyres',
    sizes: ['M', 'L', 'XL'],
    dailyRate: 275_000,
    availability: 'available',
    remaining: 1,
    summary: 'Stable gravel bike with room for a wider tyre on rough plantation roads.',
    image: '/bikes/revolt.jpg',
    imageAlt: 'Gravel bike leaning on a dirt trail',
  },
  {
    id: 'chameleon',
    name: 'Santa Cruz Chameleon',
    category: 'mountain',
    groupset: 'SRAM NX',
    wheels: '29 inch, trail tyres',
    sizes: ['S', 'M', 'L'],
    dailyRate: 400_000,
    availability: 'available',
    remaining: 1,
    summary: 'Hardtail for singletrack days around Ubud and the western ridges.',
    image: '/bikes/chameleon.jpg',
    imageAlt: 'Yellow mountain bike with knobby tyres',
  },
]

export function findRentalBike(id: string) {
  return rentalBikes.find((bike) => bike.id === id)
}

export function formatDailyRate(amount: number) {
  return `${formatIdr(amount)} / day`
}
