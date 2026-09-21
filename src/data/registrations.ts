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

export const registrations: EventRegistration[] = []

export function getRegistrations(eventSlug: string) {
  return registrations.filter((registration) => registration.eventSlug === eventSlug)
}
