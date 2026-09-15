import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import { barebonesBoxedTailwindConfig } from '~/emails/theme'
import { BarebonesFonts } from '~/emails/theme-fonts'

type VerifyEmailProps = {
  companyName?: string
  logoUrl?: string
  name?: string
  url: string
}

const DEFAULT_LOGO_URL = 'https://barongcycling.com/barong_logo.png'

export function VerifyEmail({
  companyName = 'Barong',
  logoUrl = DEFAULT_LOGO_URL,
  url,
}: VerifyEmailProps) {
  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html>
        <Head>
          <BarebonesFonts />
        </Head>

        <Body className="bg-bg-2 m-0 text-center font-sans">
          <Preview>Confirm your email address</Preview>
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
                      We&apos;re almost there!
                    </Heading>
                  </Section>

                  <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
                    Thank you for signing up for {companyName}.
                    <br />
                    To verify your account, we just need to confirm your email
                    address.
                  </Text>

                  <Section className="mb-6 text-center">
                    <Button
                      href={url}
                      className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
                    >
                      Confirm email
                    </Button>
                  </Section>

                  <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
                    If you didn&apos;t request this,
                    <br />
                    please ignore this email.
                  </Text>
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

VerifyEmail.PreviewProps = {
  companyName: 'Barong',
  logoUrl: DEFAULT_LOGO_URL,
  url: 'https://example.com/',
} satisfies VerifyEmailProps

export default VerifyEmail
