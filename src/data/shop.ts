import { formatIdr } from '~/data/events'

export type ShopProduct = {
  slug: string
  name: string
  color: string
  colorHex: string
  price: number
  description: string
  fabric: string
  sizes: string[]
  image: string
  images: string[]
  imageAlt: string
}

const shopify = (path: string) => `https://cdn.shopify.com/s/files/${path}`

export function shopImageSrc(image: string, width: number) {
  const separator = image.includes('?') ? '&' : '?'
  if (image.includes('cdn.shopify.com')) {
    return `${image}${separator}width=${width}`
  }
  return `${image}${separator}w=${width}&q=75`
}

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const jerseySizeGuide = {
  sizes,
  unit: 'cm',
  rows: [
    { label: 'Chest', values: [84, 88, 94, 100, 106, 112] },
    { label: 'Waist', values: [72, 76, 82, 88, 94, 100] },
    { label: 'Front length', values: [51, 53, 55, 57, 59, 61] },
  ],
  note: 'Race-fit. Measure around the fullest part of the chest. If you sit between sizes, take the larger for Bali heat.',
}

export const shopProducts: ShopProduct[] = [
  {
    slug: 'classic-black',
    name: 'Classic Black',
    color: 'Black',
    colorHex: '#1a1a1a',
    price: 850_000,
    description:
      'The club kit. Black body, white Barong mark, cut for Bali heat and three rides a week. Race-fit through the shoulders, long enough to stay tucked on the Kintamani climb.',
    fabric: 'Italian polyester, mesh side panels',
    sizes,
    image: shopify(
      '1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PRODUCT_CARD_HERO.jpg',
    ),
    images: [
      shopify(
        '1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PRODUCT_CARD_HERO.jpg',
      ),
      shopify(
        '1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PRODUCT_CARD_ALT.jpg',
      ),
      shopify(
        '1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PDP_SPECS_03_MOBILE.jpg',
      ),
    ],
    imageAlt: 'Black short-sleeve cycling jersey on a studio wall',
  },
  {
    slug: 'melali-white',
    name: 'Melali White',
    color: 'White',
    colorHex: '#f4f1ea',
    price: 850_000,
    description:
      'The annual jalan-jalan special. White with ink typography — the same jersey riders pick at Melali registration, now available off the event.',
    fabric: 'Lightweight polyester, UV-treated',
    sizes,
    image: shopify(
      '1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_01.jpg',
    ),
    images: [
      shopify('1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_01.jpg'),
      shopify('1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_02.jpg'),
      shopify('1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_03.jpg'),
      shopify('1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_04.jpg'),
    ],
    imageAlt: 'Rider wearing a white short-sleeve cycling jersey',
  },
  {
    slug: 'volcano-red',
    name: 'Volcano Red',
    color: 'Red',
    colorHex: '#7a1f1f',
    price: 890_000,
    description:
      'Deep red for climb season. Named after the Batur and Agung days when the bunch strings out and nobody talks until the crater rim.',
    fabric: 'Italian polyester, full-length zipper',
    sizes,
    image: shopify(
      '1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_01.jpg',
    ),
    images: [
      shopify('1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_01.jpg'),
      shopify('1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_02.jpg'),
      shopify('1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_03.jpg'),
    ],
    imageAlt: 'Rider wearing a washed-red short-sleeve cycling jersey',
  },
  {
    slug: 'sawangan-navy',
    name: 'Sawangan Navy',
    color: 'Navy',
    colorHex: '#1c2a44',
    price: 850_000,
    description:
      'Night-ride navy. Low-light friendly, three rear pockets, and a collar that sits clean under a gilet on the 04:30 roll-out.',
    fabric: 'Thermal-lite polyester, reflective hits',
    sizes,
    image: shopify(
      '1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PRODUCT_CARD_HERO_b4450420-bb5d-47f1-b77b-7193522cb2d8.jpg',
    ),
    images: [
      shopify(
        '1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PRODUCT_CARD_HERO_b4450420-bb5d-47f1-b77b-7193522cb2d8.jpg',
      ),
      shopify(
        '1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PRODUCT_CARD_ALT.jpg',
      ),
      shopify(
        '1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PDP_SPECS_03_DESKTOP.jpg',
      ),
    ],
    imageAlt: 'Navy short-sleeve cycling jersey on a studio wall',
  },
  {
    slug: 'ubud-gold',
    name: 'Ubud Gold',
    color: 'Gold',
    colorHex: '#8a4f3a',
    price: 890_000,
    description:
      'Warm gold for the Tuesday Quickie finish in Ubud. Visible in the rice terraces, quiet enough for coffee after.',
    fabric: 'Italian polyester, mesh back',
    sizes,
    image: shopify(
      '1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_HERO.jpg',
    ),
    images: [
      shopify(
        '1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_HERO.jpg',
      ),
      shopify(
        '1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_ALT.jpg',
      ),
      shopify(
        '1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PDP_SPECS_02_DESKTOP.jpg',
      ),
    ],
    imageAlt: 'Warm brown short-sleeve cycling jersey on a studio wall',
  },
  {
    slug: 'bunch-stripe',
    name: 'Bunch Stripe',
    color: 'Stripe',
    colorHex: '#1c4a8c',
    price: 920_000,
    description:
      'Black with a white hoop across the chest. The stripe the bunch can find from the back of the group — keep together, even when the road kicks.',
    fabric: 'Italian polyester, silicone hem',
    sizes,
    image: shopify(
      '1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PRODUCT_CARD_HERO.jpg',
    ),
    images: [
      shopify(
        '1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PRODUCT_CARD_HERO.jpg',
      ),
      shopify(
        '1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PRODUCT_CARD_ALT.jpg',
      ),
      shopify(
        '1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PDP_LIFESTYLE_01_DESKTOP.jpg',
      ),
    ],
    imageAlt: 'Striped short-sleeve cycling jersey on a studio wall',
  },
]

export function getShopProduct(slug: string) {
  return shopProducts.find((product) => product.slug === slug)
}

export function formatShopPrice(amount: number) {
  return formatIdr(amount)
}
