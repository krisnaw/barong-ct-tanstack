import {
  getEventGroups,
  getSeedGroup,
  type EventGroup,
} from '~/data/event-groups'
import type { PaymentMethodChoice, RegisterStep } from '~/data/events'

export type RegisterDraft = {
  courseId: string
  groupId: string
  groupName: string
  jerseySize: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  bloodType: string
  dateOfBirth: string
  nationality: string
  idNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  club: string
  paymentMethod: PaymentMethodChoice | ''
  promoCode: string
  promoDiscount: number
  donationAmount: number
  profileConfirmed: boolean
  status: 'draft' | 'pending_payment' | 'confirmed'
}

export const emptyDraft: RegisterDraft = {
  courseId: '',
  groupId: '',
  groupName: '',
  jerseySize: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  bloodType: '',
  dateOfBirth: '',
  nationality: '',
  idNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  club: '',
  paymentMethod: '',
  promoCode: '',
  promoDiscount: 0,
  donationAmount: 0,
  profileConfirmed: false,
  status: 'draft',
}

function draftKey(slug: string) {
  return `barong-register:${slug}`
}

function groupsKey(slug: string) {
  return `barong-event-groups:${slug}`
}

export function loadDraft(slug: string): RegisterDraft {
  if (typeof window === 'undefined') return emptyDraft
  try {
    const raw = sessionStorage.getItem(draftKey(slug))
    if (!raw) return emptyDraft
    return { ...emptyDraft, ...JSON.parse(raw) }
  } catch {
    return emptyDraft
  }
}

export function saveDraft(slug: string, draft: RegisterDraft) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(draftKey(slug), JSON.stringify(draft))
}

export function clearDraft(slug: string) {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(draftKey(slug))
}

export function loadCreatedGroups(slug: string): EventGroup[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(groupsKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw) as EventGroup[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCreatedGroup(group: EventGroup) {
  if (typeof window === 'undefined') return
  const current = loadCreatedGroups(group.eventSlug)
  localStorage.setItem(
    groupsKey(group.eventSlug),
    JSON.stringify([...current, group]),
  )
}

export function patchCreatedGroup(
  slug: string,
  groupId: string,
  partial: Partial<EventGroup>,
) {
  if (typeof window === 'undefined') return
  const current = loadCreatedGroups(slug)
  const next = current.map((group) =>
    group.id === groupId ? { ...group, ...partial } : group,
  )
  localStorage.setItem(groupsKey(slug), JSON.stringify(next))
}

export function findGroup(slug: string, groupId: string) {
  const seed = getSeedGroup(groupId, slug)
  if (seed) return seed
  return loadCreatedGroups(slug).find((group) => group.id === groupId)
}

export function allGroupsForEvent(slug: string) {
  return [...getEventGroups(slug), ...loadCreatedGroups(slug)]
}

export function groupNameTaken(slug: string, name: string, exceptId?: string) {
  const needle = name.trim().toLowerCase()
  return allGroupsForEvent(slug).some(
    (group) =>
      group.id !== exceptId && group.name.trim().toLowerCase() === needle,
  )
}

export function isProfileComplete(draft: Pick<
  RegisterDraft,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'gender'
  | 'bloodType'
  | 'dateOfBirth'
  | 'nationality'
  | 'idNumber'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
>) {
  return Boolean(
    draft.firstName.trim() &&
      draft.lastName.trim() &&
      draft.email.includes('@') &&
      draft.phone.trim() &&
      draft.gender &&
      draft.bloodType &&
      draft.dateOfBirth &&
      draft.nationality.trim() &&
      draft.idNumber.trim() &&
      draft.emergencyContactName.trim() &&
      draft.emergencyContactPhone.trim(),
  )
}

export function hasRegisterProgress(draft: RegisterDraft) {
  if (draft.status === 'confirmed') return true
  return Boolean(
    draft.courseId ||
      draft.groupId ||
      draft.jerseySize ||
      draft.paymentMethod ||
      draft.profileConfirmed,
  )
}

export function applyProfileToDraft(
  draft: RegisterDraft,
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    gender: string
    bloodType: string
    dateOfBirth: string
    nationality: string
    idNumber: string
    emergencyContactName: string
    emergencyContactPhone: string
  },
): RegisterDraft {
  return {
    ...draft,
    firstName: profile.firstName.trim() || draft.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    gender: profile.gender,
    bloodType: profile.bloodType,
    dateOfBirth: profile.dateOfBirth,
    nationality: profile.nationality,
    idNumber: profile.idNumber,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
  }
}

export function invitePath(slug: string, groupId: string) {
  return `/events/${slug}/register?step=course&groupId=${encodeURIComponent(groupId)}`
}

export type SavedEventRegistration = {
  categoryId: string | null
  groupId: string | null
  groupName: string | null
  jerseySize: string | null
  promoCode: string | null
  discountAmount: number
  donationAmount: number
}

/** Fill a blank resume from the registration already stored for this event. */
export function applyRegistrationToDraft(
  draft: RegisterDraft,
  registration: SavedEventRegistration | null | undefined,
): RegisterDraft {
  if (!registration) return draft
  const fresh = draft.status === 'draft' && !hasRegisterProgress(draft)
  const promoCode =
    draft.promoCode || (fresh ? registration.promoCode || '' : '')
  return {
    ...draft,
    courseId: draft.courseId || registration.categoryId || '',
    groupId: draft.groupId || registration.groupId || '',
    groupName: draft.groupName || registration.groupName || '',
    jerseySize:
      draft.jerseySize || registration.jerseySize?.trim().toUpperCase() || '',
    promoCode,
    promoDiscount: draft.promoCode
      ? draft.promoDiscount
      : fresh
        ? registration.discountAmount
        : draft.promoDiscount,
    donationAmount:
      draft.donationAmount > 0
        ? draft.donationAmount
        : fresh
          ? registration.donationAmount
          : draft.donationAmount,
  }
}

export function nextFlagshipStep(draft: RegisterDraft): RegisterStep {
  if (!draft.groupId) return 'group'
  if (!draft.courseId) return 'course'
  if (!draft.jerseySize) return 'jersey'
  if (!draft.profileConfirmed) return 'profile'
  return 'payment'
}
