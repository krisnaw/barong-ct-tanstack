export type RegistrationStatus = 'confirmed' | 'pending' | 'cancelled'

export type EventRegistration = {
  id: string
  eventSlug: string
  name: string
  email: string
  phone: string
  status: RegistrationStatus
  courseId?: string
  courseName?: string
  groupId?: string
  groupName?: string
  jerseySize?: string
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
    courseId: 'long',
    courseName: 'Long course',
    groupId: 'grp-melali-kopi',
    groupName: 'Kopi Peloton',
    jerseySize: 'L',
    paid: true,
  },
  {
    id: 'reg-melali-02',
    eventSlug: 'barong-melali-2027',
    name: 'Kadek Ayu Lestari',
    email: 'kadek.ayu@email.com',
    phone: '+62 813-2211-0099',
    status: 'confirmed',
    courseId: 'short',
    courseName: 'Short course',
    groupId: 'grp-melali-sunrise',
    groupName: 'Sunrise Spin',
    jerseySize: 'M',
    paid: true,
  },
  {
    id: 'reg-melali-03',
    eventSlug: 'barong-melali-2027',
    name: 'Putu Agus Santosa',
    email: 'putu.agus@email.com',
    phone: '+62 821-7788-3344',
    status: 'pending',
    courseId: 'long',
    courseName: 'Long course',
    groupId: 'grp-melali-kopi',
    groupName: 'Kopi Peloton',
    jerseySize: 'XL',
    paid: false,
  },
  {
    id: 'reg-melali-04',
    eventSlug: 'barong-melali-2027',
    name: 'Nyoman Sri Devi',
    email: 'nyoman.devi@email.com',
    phone: '+62 819-5566-1122',
    status: 'confirmed',
    courseId: 'long',
    courseName: 'Long course',
    groupId: 'grp-melali-kopi',
    groupName: 'Kopi Peloton',
    jerseySize: 'S',
    paid: true,
  },
  {
    id: 'reg-clinic-01',
    eventSlug: 'climb-clinic-bedugul',
    name: 'Gede Bagus Pratama',
    email: 'gede.bagus@email.com',
    phone: '+62 878-9900-2211',
    status: 'confirmed',
    paid: true,
  },
  {
    id: 'reg-clinic-02',
    eventSlug: 'climb-clinic-bedugul',
    name: 'Komang Ratih',
    email: 'komang.ratih@email.com',
    phone: '+62 812-6677-8899',
    status: 'pending',
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
