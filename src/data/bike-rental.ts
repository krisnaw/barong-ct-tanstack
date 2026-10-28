import { z } from 'zod'
import { formatIdr } from '~/data/events'

export type BikeCategory = 'road' | 'gravel' | 'mountain'

export type BikeAvailability = 'available' | 'limited' | 'booked'

export const rentalLocationIds = [
  'canggu',
  'denpasar',
  'ubud',
  'buleleng',
] as const

export type RentalLocationId = (typeof rentalLocationIds)[number]

export type RentalLocation = {
  id: RentalLocationId
  name: string
  area: string
  note: string
}

export type RentalBike = {
  id: string
  name: string
  category: BikeCategory
  groupset: string
  wheels: string
  sizes: string[]
  locations: RentalLocationId[]
  dailyRate: number
  availability: BikeAvailability
  remaining: number | null
  summary: string
  image: string
  imageAlt: string
}

export const rentalLocationSearchSchema = z.object({
  location: z.enum(rentalLocationIds).optional().catch(undefined),
})

export const bikeCategoryLabels: Record<BikeCategory, string> = {
  road: 'Road',
  gravel: 'Gravel',
  mountain: 'Mountain',
}

export const rentalLocations: RentalLocation[] = [
  {
    id: 'canggu',
    name: 'Canggu',
    area: 'South coast',
    note: 'Club base. Most of the road bikes are kept here.',
  },
  {
    id: 'denpasar',
    name: 'Denpasar',
    area: 'City',
    note: 'City pickup if you are landing or staying central.',
  },
  {
    id: 'ubud',
    name: 'Ubud',
    area: 'Central hills',
    note: 'For rides toward Kintamani and the ridges west of Ubud.',
  },
  {
    id: 'buleleng',
    name: 'Buleleng',
    area: 'North Bali',
    note: 'Singaraja and the north coast. Collect a bike while you are staying in Buleleng.',
  },
]

export const pickupTimes = ['05:15', '05:30', '05:45', '06:00', '06:15']

export const rentalBikes: RentalBike[] = [
  {
    id: 'cascade-3-s',
    name: 'Polygon Cascade 3',
    category: 'mountain',
    groupset: 'Shimano Altus',
    wheels: '27.5 inch',
    sizes: ['S'],
    locations: ['buleleng'],
    dailyRate: 100_000,
    availability: 'available',
    remaining: 1,
    summary: 'Hardtail in size S for rides around Buleleng.',
    image: '/bikes/chameleon.jpg',
    imageAlt: 'Yellow hardtail mountain bike',
  },
  {
    id: 'cascade-3-m',
    name: 'Polygon Cascade 3',
    category: 'mountain',
    groupset: 'Shimano Altus',
    wheels: '27.5 inch',
    sizes: ['M'],
    locations: ['buleleng'],
    dailyRate: 100_000,
    availability: 'available',
    remaining: 1,
    summary: 'Hardtail in size M for rides around Buleleng.',
    image: '/bikes/chameleon.jpg',
    imageAlt: 'Yellow hardtail mountain bike',
  },
]

export function findRentalBike(id: string) {
  return rentalBikes.find((bike) => bike.id === id)
}

export function findRentalLocation(id: string | undefined) {
  return rentalLocations.find((location) => location.id === id)
}

export function rentalLocationName(id: string) {
  return findRentalLocation(id)?.name ?? id
}

export function formatDailyRate(amount: number) {
  return `${formatIdr(amount)} / day`
}
