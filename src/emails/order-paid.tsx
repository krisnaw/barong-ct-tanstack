import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { barebonesBoxedTailwindConfig } from '~/emails/theme'
import { BarebonesFonts } from '~/emails/theme-fonts'

export type OrderPaidItem = {
  name: string
  detail: string
  image: string
  price: string
}

type OrderPaidProps = {
  companyName?: string
  logoUrl?: string
  firstName?: string
  invoiceNumber: string
  invoiceDateTime: string
  delivery: 'ship' | 'pickup'
  shippingLabel: string
  pickupPointName?: string
  paymentLabel?: string
  addressLines: string[]
  items: OrderPaidItem[]
  total: string
  orderUrl: string
}

export function orderPaidEmailCopy(input: {
  delivery: 'ship' | 'pickup'
  pickupPointName?: string
}) {
  if (input.delivery === 'pickup') {
    return {
      subject: 'Payment confirmed — we’re preparing your order',
      preview: 'We’ve received your payment',
      heading: 'Payment confirmed',
      intro: input.pickupPointName
        ? `Thanks — we’ve received your payment. We’ll email you when your order is ready to collect at ${input.pickupPointName}.`
        : 'Thanks — we’ve received your payment. We’ll email you when your order is ready to collect.',
      addressLabel: 'Collect at',
    }
  }
  return {
    subject: 'Payment confirmed — we’re preparing your order',
    preview: 'We’ve received your payment',
    heading: 'Payment confirmed',
    intro:
      'Thanks — we’ve received your payment. We’ll email you when your order ships.',
    addressLabel: 'Ship to',
  }
}

const DEFAULT_LOGO_URL = 'https://barongcycling.com/barong_logo.png'

export function OrderPaid({
  companyName = 'Barong',
  logoUrl = DEFAULT_LOGO_URL,
  firstName,
  invoiceNumber,
  invoiceDateTime,
  delivery,
  shippingLabel,
  pickupPointName,
  paymentLabel,
  addressLines,
  items,
  total,
  orderUrl,
}: OrderPaidProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi,'
  const copy = orderPaidEmailCopy({
    delivery,
    pickupPointName,
  })

  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html>
        <Head>
          <BarebonesFonts />
        </Head>

        <Body className="bg-bg-2 m-0 text-center font-sans">
          <Preview>{copy.preview}</Preview>
          <Container className="mobile:mt-0 mx-auto mt-8 w-full max-w-[640px]">
            <Section>
              <Section className="bg-bg mobile:px-2 px-6 py-4">
                <Section className="mb-3 px-6">
                  <Img
                    alt={companyName}
                    className="block"
                    height={32}
                    src={logoUrl}
                    width={25}
                  />
                </Section>

                <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
                  <Section className="mb-3">
                    <Heading as="h1" className="font-28 text-fg m-0 font-sans">
                      {copy.heading}
                    </Heading>
                  </Section>

                  <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[400px] text-center font-sans">
                    {greeting}
                    <br />
                    {copy.intro}
                  </Text>

                  <Section className="mb-8 text-left">
                    <Text className="font-11 text-fg-3 mt-0 mb-1 font-sans tracking-[0.14em] uppercase">
                      Invoice
                    </Text>
                    <Text className="font-14 text-fg mt-0 mb-0 font-sans">
                      {invoiceNumber}
                    </Text>
                    <Text className="font-13 text-fg-3 mt-1 mb-0 font-sans">
                      {invoiceDateTime}
                    </Text>
                    {paymentLabel ? (
                      <Text className="font-13 text-fg-3 mt-1 mb-0 font-sans">
                        Paid via {paymentLabel}
                      </Text>
                    ) : null}
                  </Section>

                  <Section className="mb-8 text-left">
                    {items.map((item) => (
                      <Row
                        className="mb-3"
                        key={`${item.name}-${item.detail}`}
                      >
                        <Column className="w-[56px] align-top">
                          <Img
                            alt=""
                            className="block bg-bg"
                            height={64}
                            src={item.image}
                            style={{ height: 'auto', objectFit: 'cover' }}
                            width={48}
                          />
                        </Column>
                        <Column className="align-top pl-3">
                          <Text className="font-14 text-fg m-0 font-sans">
                            {item.name}
                          </Text>
                          <Text className="font-13 text-fg-3 mt-1 mb-0 font-sans">
                            {item.detail}
                          </Text>
                        </Column>
                        <Column
                          align="right"
                          className="w-[96px] align-top text-right"
                        >
                          <Text className="font-13 text-fg m-0 text-right font-sans">
                            {item.price}
                          </Text>
                        </Column>
                      </Row>
                    ))}
                    <Row>
                      <Column>
                        <Hr className="border-stroke-strong mx-0 mt-4 mb-4 w-full border-solid" />
                      </Column>
                    </Row>
                    <Row>
                      <Column>
                        <Text className="font-13 text-fg-3 m-0 font-sans">
                          Total
                        </Text>
                      </Column>
                      <Column align="right">
                        <Text className="font-14 text-fg m-0 text-right font-sans">
                          {total}
                        </Text>
                      </Column>
                    </Row>
                  </Section>

                  <Section className="mb-8 text-left">
                    <Text className="font-11 text-fg-3 mt-0 mb-2 font-sans tracking-[0.14em] uppercase">
                      {copy.addressLabel}
                    </Text>
                    {delivery === 'pickup' ? null : (
                      <Text className="font-13 text-fg-3 mt-0 mb-1 font-sans">
                        {shippingLabel}
                      </Text>
                    )}
                    {addressLines.map((line) => (
                      <Text
                        className="font-14 text-fg mt-0 mb-0 font-sans"
                        key={line}
                      >
                        {line}
                      </Text>
                    ))}
                  </Section>

                  <Section className="mb-6 text-center">
                    <Button
                      href={orderUrl}
                      className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
                    >
                      View order
                    </Button>
                  </Section>
                </Section>

                <Section className="bg-bg">
                  <Text className="font-11 text-fg-3 m-0 px-6 py-10 text-center font-sans">
                    Barong Cycling Team, est 2016
                  </Text>
                </Section>
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}

OrderPaid.PreviewProps = {
  companyName: 'Barong',
  logoUrl: DEFAULT_LOGO_URL,
  firstName: 'Krisna',
  invoiceNumber: '20260915-113800',
  invoiceDateTime: '15 Sep 2026, 11:38',
  shippingLabel: 'Pickup · Barong Studio · Mon–Sat 09:00–17:00',
  delivery: 'pickup',
  pickupPointName: 'Barong Studio',
  paymentLabel: 'DOKU · qris',
  addressLines: [
    'Barong Studio',
    'Jl. Pulau Menjangan.',
    'Buleleng, Bali, 81119',
  ],
  items: [
    {
      name: 'Ubud Gold',
      detail: 'XXL · ×1',
      image:
        'https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_HERO.jpg?width=96',
      price: 'Rp890.000',
    },
    {
      name: 'Sawangan Navy',
      detail: 'M · ×1',
      image:
        'https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ328_NVY_PRODUCT_CARD_HERO.jpg?width=96',
      price: 'Rp850.000',
    },
  ],
  total: 'Rp1.740.000',
  orderUrl: 'https://barongcycling.com/account/orders/ORD-20260915-001',
} satisfies OrderPaidProps

export default OrderPaid
