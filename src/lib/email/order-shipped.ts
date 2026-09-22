import { render } from '@react-email/render'
import { formatCustomMeasurements, formatShopPrice, shopImageSrc } from '~/data/shop'
import {
  courierLabel,
  formatInvoiceDateTime,
  formatInvoiceNumber,
  orderCustomerName,
  orderPickupPointName,
  type ShopOrder,
} from '~/data/orders'
import { OrderShipped, orderFulfillmentEmailCopy } from '~/emails/order-shipped'
import { emailAbsoluteUrl, emailLogoUrl, emailPublicBaseUrl } from '~/lib/email/public-url'
import { sendEmail } from '~/lib/email/send'

function addressLines(order: ShopOrder) {
  return [
    orderCustomerName(order),
    order.address,
    [order.city, order.province, order.postal].filter(Boolean).join(', '),
  ].filter(Boolean)
}

function pickupHours(order: ShopOrder) {
  if (order.delivery !== 'pickup') return undefined
  const rest = order.shippingLabel.replace(/^Pickup · /, '')
  const parts = rest.split(' · ')
  return parts.slice(1).join(' · ') || undefined
}

function pickupAddressLines(order: ShopOrder): string[] {
  return [
    orderPickupPointName(order),
    order.address,
    [order.city, order.province, order.postal].filter(Boolean).join(', '),
  ].filter((line): line is string => Boolean(line))
}

export async function sendOrderShippedEmail(order: ShopOrder) {
  const baseUrl = emailPublicBaseUrl()
  const orderUrl = `${baseUrl}/account/orders/${order.id}`
  const isPickup = order.delivery === 'pickup'
  const pickupPointName = orderPickupPointName(order)
  const hours = pickupHours(order)
  const copy = orderFulfillmentEmailCopy({
    delivery: order.delivery,
    shippingLabel: order.shippingLabel,
    pickupPointName,
  })
  const element = OrderShipped({
    companyName: 'Barong',
    logoUrl: emailLogoUrl(),
    firstName: order.firstName,
    invoiceNumber: formatInvoiceNumber(order.placedAt),
    invoiceDateTime: formatInvoiceDateTime(order.placedAt),
    delivery: order.delivery,
    shippingLabel: order.shippingLabel,
    pickupPointName,
    pickupHours: hours,
    courierLabel: order.courier ? courierLabel(order.courier) : undefined,
    trackingNumber: order.trackingNumber,
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
      image: emailAbsoluteUrl(shopImageSrc(line.image, 96)),
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
