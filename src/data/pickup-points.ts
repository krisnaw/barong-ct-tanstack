export type PickupPoint = {
  id: string
  name: string
  address: string
  city: string
  province: string
  postal: string
  hours: string
  notes: string
  phone: string
  active: boolean
  sortOrder: number
}

export function formatPickupAddress(point: PickupPoint) {
  return [
    point.address,
    [point.city, point.province, point.postal].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')
}

export function formatPickupLabel(point: PickupPoint) {
  return point.hours
    ? `Pickup · ${point.name} · ${point.hours}`
    : `Pickup · ${point.name}`
}
