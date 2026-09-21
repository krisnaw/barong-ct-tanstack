export type EventGroup = {
  id: string
  eventSlug: string
  courseId: string
  name: string
  memberCount: number
}

/** Local wizard demo groups. Prefer D1 `event_group` when available. */
export const eventGroups: EventGroup[] = []

export function getEventGroups(eventSlug: string) {
  return eventGroups.filter((group) => group.eventSlug === eventSlug)
}

export function getSeedGroup(id: string, eventSlug?: string) {
  return eventGroups.find((group) => {
    if (group.id !== id) return false
    return eventSlug ? group.eventSlug === eventSlug : true
  })
}
