export type StaffPickupStatus = 'ready' | 'collected'

export type StaffPickupLine = {
  name: string
  color: string
  size: string
  quantity: number
  /** Optional note for custom jersey measurements, etc. */
  customNote?: string
}

export type StaffPickupOrder = {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  email: string
  pickupPointId: string
  pickupPointName: string
  paidAt: string
  lines: StaffPickupLine[]
  status: StaffPickupStatus
}

export const mockStaffPickupPoints = [
  { id: 'pp_cangu', name: 'Canggu Hub' },
  { id: 'pp_sanur', name: 'Sanur Studio' },
  { id: 'pp_ubud', name: 'Ubud Meet Point' },
] as const

export const mockStaffPickupOrders: StaffPickupOrder[] = [
  {
    id: 'ord_staff_1',
    orderNumber: 'ORD-2891',
    customerName: 'Made Wijaya',
    phone: '081234567890',
    email: 'made@example.com',
    pickupPointId: 'pp_cangu',
    pickupPointName: 'Canggu Hub',
    paidAt: '2026-09-22',
    lines: [
      {
        name: 'Club jersey',
        color: 'Black',
        size: 'M',
        quantity: 1,
      },
    ],
    status: 'ready',
  },
  {
    id: 'ord_staff_2',
    orderNumber: 'ORD-2874',
    customerName: 'Ketut Sari',
    phone: '081298765432',
    email: 'ketut@example.com',
    pickupPointId: 'pp_cangu',
    pickupPointName: 'Canggu Hub',
    paidAt: '2026-09-20',
    lines: [
      { name: 'Club cap', color: 'Black', size: 'One size', quantity: 1 },
      { name: 'Club socks', color: 'White', size: 'M', quantity: 1 },
    ],
    status: 'ready',
  },
  {
    id: 'ord_staff_3',
    orderNumber: 'ORD-2850',
    customerName: 'Agus Pratama',
    phone: '082112223333',
    email: 'agus@example.com',
    pickupPointId: 'pp_sanur',
    pickupPointName: 'Sanur Studio',
    paidAt: '2026-09-18',
    lines: [
      { name: 'Bib shorts', color: 'Navy', size: 'L', quantity: 1 },
      {
        name: 'Club jersey',
        color: 'White',
        size: 'L',
        quantity: 1,
        customNote: 'Chest 104 · Sleeve 62 · Front zipper 58 · Back 72',
      },
    ],
    status: 'ready',
  },
  {
    id: 'ord_staff_4',
    orderNumber: 'ORD-2801',
    customerName: 'Ni Luh Ayu',
    phone: '081355566677',
    email: 'ayu@example.com',
    pickupPointId: 'pp_ubud',
    pickupPointName: 'Ubud Meet Point',
    paidAt: '2026-09-15',
    lines: [{ name: 'Club jersey', color: 'White', size: 'S', quantity: 1 }],
    status: 'ready',
  },
  {
    id: 'ord_staff_5',
    orderNumber: 'ORD-2788',
    customerName: 'Budi Santoso',
    phone: '087711122233',
    email: 'budi@example.com',
    pickupPointId: 'pp_cangu',
    pickupPointName: 'Canggu Hub',
    paidAt: '2026-09-10',
    lines: [{ name: 'Club socks', color: 'Black', size: 'L', quantity: 1 }],
    status: 'collected',
  },
]

export function staffPickupItemCount(order: StaffPickupOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function staffPickupItemSummary(order: StaffPickupOrder) {
  return order.lines
    .map((line) => `${line.name} · ${line.color} / ${line.size}`)
    .join(' · ')
}

export function matchesStaffPickupQuery(
  order: StaffPickupOrder,
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    order.orderNumber.toLowerCase().includes(q) ||
    order.customerName.toLowerCase().includes(q) ||
    order.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
    order.email.toLowerCase().includes(q) ||
    order.lines.some(
      (line) =>
        line.name.toLowerCase().includes(q) ||
        line.color.toLowerCase().includes(q) ||
        line.size.toLowerCase().includes(q),
    )
  )
}
