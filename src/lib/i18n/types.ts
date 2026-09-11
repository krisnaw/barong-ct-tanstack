export type Locale = 'en' | 'id'

export type RideCopy = {
  day: string
  name: string
  meet: string
  detail: string
}

export type Messages = {
  nav: {
    primary: string
    mobile: string
    events: string
    shop: string
    menu: string
    openMenu: string
    bag: string
    bagWithCount: string
    bagItem: string
    bagItems: string
  }
  footer: {
    nav: string
    rides: string
    events: string
    shop: string
  }
  lang: {
    label: string
    english: string
    indonesia: string
  }
  accountMenu: {
    signIn: string
    sign: string
    account: string
    profile: string
    shippingAddress: string
    orders: string
    signOut: string
  }
  verifyEmail: {
    prompt: string
    sentSuffix: string
    resend: string
    sending: string
    emailSent: string
    resendError: string
  }
  hero: {
    location: string
    est: string
    tagline: string
    body: string
    joinRide: string
    events: string
    shop: string
    imageAlt: string
  }
  rides: {
    eyebrow: string
    title: string
    body: string
    followStrava: string
    followIg: string
    meet: string
    time: string
    timeValue: string
    items: RideCopy[]
  }
  events: {
    eyebrow: string
    title: string
    body: string
    latest: string
    distance: string
    start: string
    field: string
    viewRecap: string
  }
}
