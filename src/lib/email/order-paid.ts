import { render } from '@react-email/render'
import { env } from 'cloudflare:workers'
import { formatCustomMeasurements, formatShopPrice, shopImageSrc } from '~/data/shop'
import {
  formatInvoiceDateTime,
  formatInvoiceNumber,
  formatPaymentLabel,
  orderCustomerName,
  orderPickupPointName,
  type ShopOrder,
} from '~/data/orders'
import { OrderPaid, orderPaidEmailCopy } from '~/emails/order-paid'
import { sendEmail } from '~/lib/email/send'

function publicBaseUrl() {
  return (env.BETTER_AUTH_URL || 'https://barongcycling.com').replace(/\/$/, '')
}

function addressLines(order: ShopOrder) {
  return [
    orderCustomerName(order),
    order.address,
    [order.city, order.province, order.postal].filter(Boolean).join(', '),
  ].filter(Boolean)
}

function pickupAddressLines(order: ShopOrder): string[] {
  return [
    orderPickupPointName(order),
    order.address,
    [order.city, order.province, order.postal].filter(Boolean).join(', '),
  ].filter((line): line is string => Boolean(line))
}

export async function sendOrderPaidEmail(order: ShopOrder) {
  const baseUrl = publicBaseUrl()
  const orderUrl = `${baseUrl}/account/orders/${order.id}`
  const isPickup = order.delivery === 'pickup'
  const pickupPointName = orderPickupPointName(order)
  const paymentLabel = formatPaymentLabel(order)
  const copy = orderPaidEmailCopy({
    delivery: order.delivery,
    pickupPointName,
  })
  const element = OrderPaid({
    companyName: 'Barong',
    logoUrl: `${baseUrl}/barong_logo.png`,
    firstName: order.firstName,
    invoiceNumber: formatInvoiceNumber(order.placedAt),
    invoiceDateTime: formatInvoiceDateTime(order.placedAt),
    delivery: order.delivery,
    shippingLabel: order.shippingLabel,
    pickupPointName,
    paymentLabel: paymentLabel === '-' ? undefined : paymentLabel,
    addressLines: isPickup ? pickupAddressLines(order) : addressLines(order),
    items: order.lines.map((line) => ({
      name: line.name,
      detail: [
        line.size,
        `×${line.quantity}`,
        line.custom ? formatCustomMeasurements(line.custom) : '',
      ]
        .filter(Boolean)
        .join(' · '),
      image: shopImageSrc(line.image, 96),
      price: formatShopPrice(line.price * line.quantity),
    })),
    total: formatShopPrice(order.total),
    orderUrl,
  })
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  await sendEmail({
    to: { email: order.email, name: orderCustomerName(order) },
    subject: copy.subject,
    html,
    text,
  })
}
