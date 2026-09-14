import { render } from '@react-email/render'
import { env } from 'cloudflare:workers'
import { formatCustomMeasurements, formatShopPrice, shopImageSrc } from '~/data/shop'
import {
  courierLabel,
  formatInvoiceDateTime,
  formatInvoiceNumber,
  orderCustomerName,
  type ShopOrder,
} from '~/data/orders'
import { OrderShipped } from '~/emails/order-shipped'
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

export async function sendOrderShippedEmail(order: ShopOrder) {
  const baseUrl = publicBaseUrl()
  const orderUrl = `${baseUrl}/account/orders/${order.id}`
  const element = OrderShipped({
    companyName: 'Barong',
    logoUrl: `${baseUrl}/barong_logo.png`,
    firstName: order.firstName,
    invoiceNumber: formatInvoiceNumber(order.placedAt),
    invoiceDateTime: formatInvoiceDateTime(order.placedAt),
    shippingLabel: order.shippingLabel,
    courierLabel: order.courier ? courierLabel(order.courier) : undefined,
    trackingNumber: order.trackingNumber,
    addressLines: addressLines(order),
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
    subject: 'Your order has been shipped',
    html,
    text,
  })
}
