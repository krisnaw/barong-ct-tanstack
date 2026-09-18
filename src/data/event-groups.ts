export type EventGroup = {
  id: string
  eventSlug: string
  courseId: string
  name: string
  memberCount: number
}

export const eventGroups: EventGroup[] = [
  {
    id: 'grp-melali-kopi',
    eventSlug: 'barong-melali-2027',
    courseId: 'long',
    name: 'Kopi Peloton',
    memberCount: 3,
  },
  {
    id: 'grp-melali-sunrise',
    eventSlug: 'barong-melali-2027',
    courseId: 'short',
    name: 'Sunrise Spin',
    memberCount: 2,
  },
]

export function getEventGroups(eventSlug: string) {
  return eventGroups.filter((group) => group.eventSlug === eventSlug)
}

export function getSeedGroup(id: string, eventSlug?: string) {
  return eventGroups.find((group) => {
    if (group.id !== id) return false
    return eventSlug ? group.eventSlug === eventSlug : true
  })
}
