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

export type EventRegisteredDetail = {
  label: string
  value: string
}

type EventRegisteredProps = {
  companyName?: string
  logoUrl?: string
  firstName?: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  details: EventRegisteredDetail[]
  totalLabel: string
  totalValue: string
  eventUrl: string
  isPaid: boolean
}

export function eventRegisteredEmailCopy(input: {
  eventName: string
  isPaid: boolean
}) {
  return {
    subject: `You’re registered — ${input.eventName}`,
    preview: input.isPaid
      ? 'Payment received — your spot is confirmed'
      : 'Your spot is confirmed',
    heading: 'You’re registered',
    intro: input.isPaid
      ? `Thanks — we’ve confirmed your registration for ${input.eventName}.`
      : `You’re in for ${input.eventName}. See you at the start.`,
  }
}

const DEFAULT_LOGO_URL = 'https://barongcycling.com/barong-no-bg.png'

export function EventRegistered({
  companyName = 'Barong',
  logoUrl = DEFAULT_LOGO_URL,
  firstName,
  eventName,
  eventDate,
  eventTime,
  location,
  details,
  totalLabel,
  totalValue,
  eventUrl,
  isPaid,
}: EventRegisteredProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi,'
  const copy = eventRegisteredEmailCopy({ eventName, isPaid })

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
                    height={56}
                    src={logoUrl}
                    width={44}
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
                      Event
                    </Text>
                    <Text className="font-16 text-fg mt-0 mb-0 font-sans">
                      {eventName}
                    </Text>
                    <Text className="font-13 text-fg-3 mt-2 mb-0 font-sans">
                      {eventDate} · {eventTime}
                    </Text>
                    <Text className="font-13 text-fg-3 mt-1 mb-0 font-sans">
                      {location}
                    </Text>
                  </Section>

                  {details.length > 0 ? (
                    <Section className="mb-8 text-left">
                      {details.map((detail) => (
                        <Row className="mb-2" key={detail.label}>
                          <Column>
                            <Text className="font-13 text-fg-3 m-0 font-sans">
                              {detail.label}
                            </Text>
                          </Column>
                          <Column align="right">
                            <Text className="font-13 text-fg m-0 text-right font-sans">
                              {detail.value}
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
                            {totalLabel}
                          </Text>
                        </Column>
                        <Column align="right">
                          <Text className="font-14 text-fg m-0 text-right font-sans">
                            {totalValue}
                          </Text>
                        </Column>
                      </Row>
                    </Section>
                  ) : null}

                  <Section className="mb-6 text-center">
                    <Button
                      href={eventUrl}
                      className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
                    >
                      View event
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

EventRegistered.PreviewProps = {
  companyName: 'Barong',
  logoUrl: DEFAULT_LOGO_URL,
  firstName: 'Krisna',
  eventName: 'Barong Melali',
  eventDate: '20 September 2026',
  eventTime: '05:30 GMT+8',
  location: 'Sanur Beach',
  details: [
    { label: 'Category', value: 'Gran Fondo · 120 km' },
    { label: 'Group', value: 'Peloton A' },
    { label: 'Jersey', value: 'L' },
    { label: 'Promo', value: 'EARLYBIRD (−Rp50.000)' },
  ],
  totalLabel: 'Paid',
  totalValue: 'Rp450.000',
  eventUrl: 'https://barongcycling.com/events/barong-melali',
  isPaid: true,
} satisfies EventRegisteredProps

export default EventRegistered
