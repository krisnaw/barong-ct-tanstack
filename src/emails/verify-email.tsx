import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

type VerifyEmailProps = {
  name: string
  url: string
}

export function VerifyEmail({ name, url }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Barong CT email</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Confirm your email</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thanks for joining Barong Cycling Team. Click below to verify your
            email address.
          </Text>
          <Button href={url} style={button}>
            Verify email
          </Button>
          <Text style={muted}>
            If you did not create this account, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '32px 24px',
  maxWidth: '480px',
}

const heading = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#18181b',
  margin: '0 0 16px',
}

const text = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3f3f46',
  margin: '0 0 12px',
}

const button = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 20px',
  textDecoration: 'none',
  margin: '16px 0',
}

const muted = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#71717a',
  margin: '24px 0 0',
}

export default VerifyEmail
