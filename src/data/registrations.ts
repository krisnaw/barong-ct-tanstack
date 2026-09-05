export type RegistrationStatus = 'confirmed' | 'pending' | 'cancelled'

export type EventRegistration = {
  id: string
  eventSlug: string
  name: string
  email: string
  phone: string
  status: RegistrationStatus
  jerseyId?: string
  jerseyName?: string
  jerseySize?: string
  routeId?: string
  routeName?: string
  paid?: boolean
}

export const registrations: EventRegistration[] = [
  {
    id: 'reg-melali-01',
    eventSlug: 'barong-melali-2027',
    name: 'Made Wirawan',
    email: 'made.wirawan@email.com',
    phone: '+62 812-3456-7801',
    status: 'confirmed',
    jerseyId: 'classic-black',
    jerseyName: 'Classic Black',
    jerseySize: 'L',
    routeId: 'long',
    routeName: 'Long route',
    paid: true,
  },
  {
    id: 'reg-melali-02',
    eventSlug: 'barong-melali-2027',
    name: 'Kadek Ayu Lestari',
    email: 'kadek.ayu@email.com',
    phone: '+62 813-2211-0099',
    status: 'confirmed',
    jerseyId: 'melali-white',
    jerseyName: 'Melali White',
    jerseySize: 'M',
    routeId: 'short',
    routeName: 'Short route',
    paid: true,
  },
  {
    id: 'reg-melali-03',
    eventSlug: 'barong-melali-2027',
    name: 'Putu Agus Santosa',
    email: 'putu.agus@email.com',
    phone: '+62 821-7788-3344',
    status: 'pending',
    jerseyId: 'classic-black',
    jerseyName: 'Classic Black',
    jerseySize: 'XL',
    routeId: 'long',
    routeName: 'Long route',
    paid: false,
  },
  {
    id: 'reg-melali-04',
    eventSlug: 'barong-melali-2027',
    name: 'Nyoman Sri Devi',
    email: 'nyoman.devi@email.com',
    phone: '+62 819-5566-1122',
    status: 'confirmed',
    jerseyId: 'melali-white',
    jerseyName: 'Melali White',
    jerseySize: 'S',
    routeId: 'long',
    routeName: 'Long route',
    paid: true,
  },
  {
    id: 'reg-melali-05',
    eventSlug: 'barong-melali-2027',
    name: 'Gede Bagus Pratama',
    email: 'gede.bagus@email.com',
    phone: '+62 878-9900-2211',
    status: 'confirmed',
    jerseyId: 'classic-black',
    jerseyName: 'Classic Black',
    jerseySize: 'M',
    routeId: 'short',
    routeName: 'Short route',
    paid: true,
  },
  {
    id: 'reg-melali-06',
    eventSlug: 'barong-melali-2027',
    name: 'Komang Ratih',
    email: 'komang.ratih@email.com',
    phone: '+62 812-6677-8899',
    status: 'cancelled',
    jerseyId: 'melali-white',
    jerseyName: 'Melali White',
    jerseySize: 'L',
    routeId: 'short',
    routeName: 'Short route',
    paid: false,
  },
  {
    id: 'reg-melali-07',
    eventSlug: 'barong-melali-2027',
    name: 'Wayan Adi Nugraha',
    email: 'wayan.adi@email.com',
    phone: '+62 813-4455-6677',
    status: 'confirmed',
    jerseyId: 'classic-black',
    jerseyName: 'Classic Black',
    jerseySize: 'XXL',
    routeId: 'long',
    routeName: 'Long route',
    paid: true,
  },
  {
    id: 'reg-melali-08',
    eventSlug: 'barong-melali-2027',
    name: 'Luh Putu Sari',
    email: 'luh.putu@email.com',
    phone: '+62 822-1100-3344',
    status: 'pending',
    jerseyId: 'melali-white',
    jerseyName: 'Melali White',
    jerseySize: 'XS',
    routeId: 'short',
    routeName: 'Short route',
    paid: false,
  },
  {
    id: 'reg-climax-01',
    eventSlug: 'saturday-climax-kintamani',
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '+62 812-1000-2000',
    status: 'confirmed',
  },
  {
    id: 'reg-climax-02',
    eventSlug: 'saturday-climax-kintamani',
    name: 'Siti Rahayu',
    email: 'siti.rahayu@email.com',
    phone: '+62 813-3000-4000',
    status: 'confirmed',
  },
  {
    id: 'reg-climax-03',
    eventSlug: 'saturday-climax-kintamani',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@email.com',
    phone: '+62 821-5000-6000',
    status: 'pending',
  },
  {
    id: 'reg-foreplay-01',
    eventSlug: 'thursday-foreplay',
    name: 'Rina Kartika',
    email: 'rina.kartika@email.com',
    phone: '+62 812-7000-8000',
    status: 'confirmed',
  },
  {
    id: 'reg-foreplay-02',
    eventSlug: 'thursday-foreplay',
    name: 'Hendra Gunawan',
    email: 'hendra.gunawan@email.com',
    phone: '+62 878-9000-1000',
    status: 'confirmed',
  },
]

export function getRegistrations(eventSlug: string) {
  return registrations.filter((registration) => registration.eventSlug === eventSlug)
}
