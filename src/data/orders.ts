import { getShopProduct } from '~/data/shop'

export type OrderStatus =
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type OrderPayment = 'unpaid' | 'paid'
export type OrderDelivery = 'ship' | 'pickup'

export type ShopOrderLine = {
  slug: string
  name: string
  color: string
  size: string
  quantity: number
  price: number
  image: string
}

export type ShopOrder = {
  id: string
  placedAt: string
  email: string
  firstName: string
  lastName: string
  phone: string
  delivery: OrderDelivery
  address: string
  city: string
  province: string
  postal: string
  shippingLabel: string
  lines: ShopOrderLine[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  payment: OrderPayment
}

export const orderStatuses: OrderStatus[] = [
  'pending',
  'packed',
  'shipped',
  'completed',
  'cancelled',
]

function line(slug: string, size: string, quantity: number): ShopOrderLine {
  const product = getShopProduct(slug)
  if (!product) {
    throw new Error(`Unknown shop product: ${slug}`)
  }
  return {
    slug,
    name: product.name,
    color: product.color,
    size,
    quantity,
    price: product.price,
    image: product.image,
  }
}

function totals(lines: ShopOrderLine[], shipping: number, discount = 0) {
  const subtotal = lines.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return {
    subtotal,
    shipping,
    discount,
    total: Math.max(subtotal - discount + shipping, 0),
  }
}

const wirawanLines = [line('classic-black', 'L', 1)]
const ayuLines = [line('melali-white', 'M', 1)]
const gedeLines = [line('volcano-red', 'XL', 1), line('bunch-stripe', 'M', 1)]
const kadekLines = [line('sawangan-navy', 'S', 2)]
const putuLines = [line('ubud-gold', 'L', 1)]
const nyomanLines = [line('classic-black', 'XS', 1)]

export const shopOrders: ShopOrder[] = [
  {
    id: 'BCT-2406',
    placedAt: '2026-09-10T06:20:00+08:00',
    email: 'gede.riza@barong.ct',
    firstName: 'Gede',
    lastName: 'Riza',
    phone: '+62 812-8800-1122',
    delivery: 'pickup',
    address: '',
    city: 'Denpasar',
    province: 'Bali',
    postal: '',
    shippingLabel: 'Pickup · Denpasar meet point',
    lines: gedeLines,
    ...totals(gedeLines, 0),
    status: 'pending',
    payment: 'unpaid',
  },
  {
    id: 'BCT-2405',
    placedAt: '2026-09-09T18:05:00+08:00',
    email: 'made.wirawan@email.com',
    firstName: 'Made',
    lastName: 'Wirawan',
    phone: '+62 812-3456-7801',
    delivery: 'pickup',
    address: '',
    city: 'Denpasar',
    province: 'Bali',
    postal: '',
    shippingLabel: 'Pickup · Denpasar meet point',
    lines: wirawanLines,
    ...totals(wirawanLines, 0),
    status: 'packed',
    payment: 'paid',
  },
  {
    id: 'BCT-2404',
    placedAt: '2026-09-08T11:40:00+08:00',
    email: 'ayu.prameswari@email.com',
    firstName: 'Ayu',
    lastName: 'Prameswari',
    phone: '+62 813-2211-0099',
    delivery: 'ship',
    address: 'Jalan Raya Ubud No. 12',
    city: 'Ubud',
    province: 'Bali',
    postal: '80571',
    shippingLabel: 'JNE Regular · 2–4 business days',
    lines: ayuLines,
    ...totals(ayuLines, 35_000),
    status: 'shipped',
    payment: 'paid',
  },
  {
    id: 'BCT-2403',
    placedAt: '2026-09-07T09:15:00+08:00',
    email: 'putu.agus@email.com',
    firstName: 'Putu',
    lastName: 'Agus Santosa',
    phone: '+62 821-7788-3344',
    delivery: 'pickup',
    address: '',
    city: 'Denpasar',
    province: 'Bali',
    postal: '',
    shippingLabel: 'Pickup · Denpasar meet point',
    lines: putuLines,
    ...totals(putuLines, 0, 50_000),
    status: 'packed',
    payment: 'paid',
  },
  {
    id: 'BCT-2402',
    placedAt: '2026-09-02T16:48:00+08:00',
    email: 'kadek.ayu@email.com',
    firstName: 'Kadek',
    lastName: 'Ayu Lestari',
    phone: '+62 819-5566-1122',
    delivery: 'ship',
    address: 'Jl. Senopati No. 8',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postal: '12110',
    shippingLabel: 'JNE YES · 1–2 business days',
    lines: kadekLines,
    ...totals(kadekLines, 55_000, 85_000),
    status: 'completed',
    payment: 'paid',
  },
  {
    id: 'BCT-2401',
    placedAt: '2026-09-01T08:12:00+08:00',
    email: 'nyoman.devi@email.com',
    firstName: 'Nyoman',
    lastName: 'Sri Devi',
    phone: '+62 878-9900-2211',
    delivery: 'pickup',
    address: '',
    city: 'Denpasar',
    province: 'Bali',
    postal: '',
    shippingLabel: 'Pickup · Denpasar meet point',
    lines: nyomanLines,
    ...totals(nyomanLines, 0),
    status: 'cancelled',
    payment: 'unpaid',
  },
]

export function getShopOrder(id: string) {
  return shopOrders.find((order) => order.id === id)
}

export function orderCustomerName(order: ShopOrder) {
  return `${order.firstName} ${order.lastName}`.trim()
}

export function orderItemCount(order: ShopOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date(iso))
}
