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

export type OrderShippedItem = {
  name: string
  detail: string
  image: string
  price: string
}

type OrderShippedProps = {
  companyName?: string
  logoUrl?: string
  firstName?: string
  invoiceNumber: string
  invoiceDateTime: string
  shippingLabel: string
  courierLabel?: string
  trackingNumber?: string
  addressLines: string[]
  items: OrderShippedItem[]
  total: string
  orderUrl: string
}

const DEFAULT_LOGO_URL = 'https://barongcycling.com/barong_logo.png'

export function OrderShipped({
  companyName = 'Barong',
  logoUrl = DEFAULT_LOGO_URL,
  firstName,
  invoiceNumber,
  invoiceDateTime,
  shippingLabel,
  courierLabel,
  trackingNumber,
  addressLines,
  items,
  total,
  orderUrl,
}: OrderShippedProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi,'

  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html>
        <Head>
          <BarebonesFonts />
        </Head>

        <Body className="bg-bg-2 m-0 text-center font-sans">
          <Preview>Your order has been shipped</Preview>
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
                    <Img
                      alt={companyName}
                      className="mx-auto mb-5 block"
                      height={72}
                      src={logoUrl}
                      width={56}
                    />
                    <Heading as="h1" className="font-28 text-fg m-0 font-sans">
                      Your kit is on the way
                    </Heading>
                  </Section>

                  <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[400px] text-center font-sans">
                    {greeting}
                    <br />
                    Your order has been shipped via {shippingLabel}.
                    {courierLabel && trackingNumber ? (
                      <>
                        <br />
                        {courierLabel} tracking {trackingNumber}.
                      </>
                    ) : null}
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
                      Ship to
                    </Text>
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

OrderShipped.PreviewProps = {
  companyName: 'Barong',
  logoUrl: DEFAULT_LOGO_URL,
  firstName: 'Krisna',
  invoiceNumber: '20260914-105032',
  invoiceDateTime: '14 Sep 2026, 10:50',
  shippingLabel: 'JNE Regular · 2–4 business days',
  courierLabel: 'JNE',
  trackingNumber: '882837192001',
  addressLines: [
    'Jl. Pulau Menjangan.',
    'Buleleng, Bali, 81119',
  ],
  items: [
    {
      name: 'Ubud Gold',
      detail: 'XXL · ×1',
      image:
        'https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_HERO.jpg?width=96',
      price: 'Rp 890.000',
    },
    {
      name: 'Sawangan Navy',
      detail: 'M · ×1',
      image:
        'https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ328_NVY_PRODUCT_CARD_HERO.jpg?width=96',
      price: 'Rp 850.000',
    },
  ],
  total: 'Rp 1.775.000',
  orderUrl: 'https://barongcycling.com/account/orders/20260914-105032',
} satisfies OrderShippedProps

export default OrderShipped
