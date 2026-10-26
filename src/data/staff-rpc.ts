import { eventTimeZoneToIana } from '~/lib/event-datetime'

export type StaffRpcParticipant = {
  id: string
  name: string
  bibNumber: string | null
  jerseySize: string | null
  categoryName: string | null
  kitCollectedAt: string | null
}

export function matchesRpcQuery(participant: StaffRpcParticipant, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const bib = participant.bibNumber?.toLowerCase() ?? ''
  return participant.name.toLowerCase().includes(q) || bib.includes(q)
}

export type RpcCategoryStat = {
  categoryName: string
  total: number
  collected: number
  remaining: number
}

export function rpcCategoryStats(
  participants: StaffRpcParticipant[],
): RpcCategoryStat[] {
  const byCategory = new Map<string, { total: number; collected: number }>()

  for (const participant of participants) {
    const categoryName = participant.categoryName ?? 'Uncategorized'
    const current = byCategory.get(categoryName) ?? { total: 0, collected: 0 }
    current.total += 1
    if (participant.kitCollectedAt) current.collected += 1
    byCategory.set(categoryName, current)
  }

  return [...byCategory.entries()]
    .map(([categoryName, { total, collected }]) => ({
      categoryName,
      total,
      collected,
      remaining: total - collected,
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}

export function formatRpcCollectedAt(iso: string, timeZone?: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: eventTimeZoneToIana(timeZone),
  }).format(date)
}
