-- Migration number: 0006 	 2026-09-12T02:30:00.000Z

CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`color_hex` text NOT NULL,
	`price` integer NOT NULL,
	`description` text NOT NULL,
	`fabric` text NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`image` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`image_alt` text NOT NULL,
	`pre_order` integer DEFAULT true NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

CREATE UNIQUE INDEX `product_slug_unique` ON `product` (`slug`);
CREATE INDEX `product_active_sort_idx` ON `product` (`active`, `sort_order`);

CREATE TABLE `product_size` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `product_size_product_size_uidx` ON `product_size` (`product_id`, `size`);
CREATE INDEX `product_size_productId_idx` ON `product_size` (`product_id`);

INSERT INTO `product` (`id`, `slug`, `name`, `color`, `color_hex`, `price`, `description`, `fabric`, `features`, `image`, `images`, `image_alt`, `pre_order`, `active`, `sort_order`) VALUES (
	'prod_classic_black',
	'classic-black',
	'Classic Black',
	'Black',
	'#1a1a1a',
	850000,
	'The club kit. Black body, white Barong mark, cut for Bali heat and three rides a week. Race-fit through the shoulders, long enough to stay tucked on the Kintamani climb.',
	'Italian polyester, mesh side panels',
	'["Race-fit club cut for Bali heat","Three rear pockets","Full-length YKK zipper","Mesh side panels for breathability","Silicone grippers at sleeve cuffs and hem","UV-treated polyester","White Barong mark on black body","Club kit for Tuesday, Thursday, and Saturday rides"]',
	'https://cdn.shopify.com/s/files/1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PRODUCT_CARD_HERO.jpg',
	'["https://cdn.shopify.com/s/files/1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PRODUCT_CARD_HERO.jpg","https://cdn.shopify.com/s/files/1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PRODUCT_CARD_ALT.jpg","https://cdn.shopify.com/s/files/1/0570/5446/2121/products/MAP-MAJ328_BLK_TrainingJersey_Black_PDP_SPECS_03_MOBILE.jpg"]',
	'Black short-sleeve cycling jersey on a studio wall',
	0,
	1,
	0
);

INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_classic_black_xs', 'prod_classic_black', 'XS', 99, 0);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_classic_black_s', 'prod_classic_black', 'S', 99, 1);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_classic_black_m', 'prod_classic_black', 'M', 99, 2);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_classic_black_l', 'prod_classic_black', 'L', 99, 3);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_classic_black_xl', 'prod_classic_black', 'XL', 99, 4);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_classic_black_xxl', 'prod_classic_black', 'XXL', 99, 5);

INSERT INTO `product` (`id`, `slug`, `name`, `color`, `color_hex`, `price`, `description`, `fabric`, `features`, `image`, `images`, `image_alt`, `pre_order`, `active`, `sort_order`) VALUES (
	'prod_melali_white',
	'melali-white',
	'Melali White',
	'White',
	'#f4f1ea',
	850000,
	'The annual jalan-jalan special. White with ink typography — the same jersey riders pick at Melali registration, now available off the event.',
	'Lightweight polyester, UV-treated',
	'["Race-fit club cut for Bali heat","Three rear pockets","Full-length YKK zipper","Mesh side panels for breathability","Silicone grippers at sleeve cuffs and hem","UV-treated polyester","Melali ink typography on white body","Event special, available off Melali registration"]',
	'https://cdn.shopify.com/s/files/1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_01.jpg',
	'["https://cdn.shopify.com/s/files/1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_01.jpg","https://cdn.shopify.com/s/files/1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_02.jpg","https://cdn.shopify.com/s/files/1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_03.jpg","https://cdn.shopify.com/s/files/1/1431/8222/files/MPMJE213725_WHIT.TrainingJersey_PDP_04.jpg"]',
	'Rider wearing a white short-sleeve cycling jersey',
	1,
	1,
	1
);

INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_melali_white_xs', 'prod_melali_white', 'XS', 0, 0);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_melali_white_s', 'prod_melali_white', 'S', 0, 1);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_melali_white_m', 'prod_melali_white', 'M', 0, 2);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_melali_white_l', 'prod_melali_white', 'L', 0, 3);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_melali_white_xl', 'prod_melali_white', 'XL', 0, 4);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_melali_white_xxl', 'prod_melali_white', 'XXL', 0, 5);

INSERT INTO `product` (`id`, `slug`, `name`, `color`, `color_hex`, `price`, `description`, `fabric`, `features`, `image`, `images`, `image_alt`, `pre_order`, `active`, `sort_order`) VALUES (
	'prod_volcano_red',
	'volcano-red',
	'Volcano Red',
	'Red',
	'#7a1f1f',
	890000,
	'Deep red for climb season. Named after the Batur and Agung days when the bunch strings out and nobody talks until the crater rim.',
	'Italian polyester, full-length zipper',
	'["Race-fit club cut for Bali heat","Three rear pockets","Full-length YKK zipper","Mesh side panels for breathability","Silicone grippers at sleeve cuffs and hem","UV-treated polyester","Deep volcano red for climb season","Built for Batur and Agung days"]',
	'https://cdn.shopify.com/s/files/1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_01.jpg',
	'["https://cdn.shopify.com/s/files/1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_01.jpg","https://cdn.shopify.com/s/files/1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_02.jpg","https://cdn.shopify.com/s/files/1/0510/7809/files/MPMJE260526_WSHR.TrainingJersey2.0_PDP_03.jpg"]',
	'Rider wearing a washed-red short-sleeve cycling jersey',
	1,
	1,
	2
);

INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_volcano_red_xs', 'prod_volcano_red', 'XS', 0, 0);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_volcano_red_s', 'prod_volcano_red', 'S', 0, 1);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_volcano_red_m', 'prod_volcano_red', 'M', 0, 2);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_volcano_red_l', 'prod_volcano_red', 'L', 0, 3);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_volcano_red_xl', 'prod_volcano_red', 'XL', 0, 4);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_volcano_red_xxl', 'prod_volcano_red', 'XXL', 0, 5);

INSERT INTO `product` (`id`, `slug`, `name`, `color`, `color_hex`, `price`, `description`, `fabric`, `features`, `image`, `images`, `image_alt`, `pre_order`, `active`, `sort_order`) VALUES (
	'prod_sawangan_navy',
	'sawangan-navy',
	'Sawangan Navy',
	'Navy',
	'#1c2a44',
	850000,
	'Night-ride navy. Low-light friendly, three rear pockets, and a collar that sits clean under a gilet on the 04:30 roll-out.',
	'Thermal-lite polyester, reflective hits',
	'["Race-fit club cut for Bali heat","Three rear pockets","Full-length YKK zipper","Mesh side panels for breathability","Silicone grippers at sleeve cuffs and hem","UV-treated polyester","Night-ride navy with reflective hits","Collar sits clean under a gilet"]',
	'https://cdn.shopify.com/s/files/1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PRODUCT_CARD_HERO_b4450420-bb5d-47f1-b77b-7193522cb2d8.jpg',
	'["https://cdn.shopify.com/s/files/1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PRODUCT_CARD_HERO_b4450420-bb5d-47f1-b77b-7193522cb2d8.jpg","https://cdn.shopify.com/s/files/1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PRODUCT_CARD_ALT.jpg","https://cdn.shopify.com/s/files/1/1431/8222/products/MENSTrainingJerseySS_MAP-MAJ253_NVY_Navy_PDP_SPECS_03_DESKTOP.jpg"]',
	'Navy short-sleeve cycling jersey on a studio wall',
	0,
	1,
	3
);

INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_sawangan_navy_xs', 'prod_sawangan_navy', 'XS', 99, 0);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_sawangan_navy_s', 'prod_sawangan_navy', 'S', 99, 1);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_sawangan_navy_m', 'prod_sawangan_navy', 'M', 99, 2);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_sawangan_navy_l', 'prod_sawangan_navy', 'L', 99, 3);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_sawangan_navy_xl', 'prod_sawangan_navy', 'XL', 99, 4);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_sawangan_navy_xxl', 'prod_sawangan_navy', 'XXL', 99, 5);

INSERT INTO `product` (`id`, `slug`, `name`, `color`, `color_hex`, `price`, `description`, `fabric`, `features`, `image`, `images`, `image_alt`, `pre_order`, `active`, `sort_order`) VALUES (
	'prod_ubud_gold',
	'ubud-gold',
	'Ubud Gold',
	'Gold',
	'#8a4f3a',
	890000,
	'Warm gold for the Tuesday Quickie finish in Ubud. Visible in the rice terraces, quiet enough for coffee after.',
	'Italian polyester, mesh back',
	'["Race-fit club cut for Bali heat","Three rear pockets","Full-length YKK zipper","Mesh side panels for breathability","Silicone grippers at sleeve cuffs and hem","UV-treated polyester","Warm gold for the Ubud finish","Mesh back panel for heat dump"]',
	'https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_HERO.jpg',
	'["https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_HERO.jpg","https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PRODUCT_CARD_ALT.jpg","https://cdn.shopify.com/s/files/1/1431/8222/products/MENS_TrainingJersey_MAP-MAJ226_CAP_Cappuccino_PDP_SPECS_02_DESKTOP.jpg"]',
	'Warm brown short-sleeve cycling jersey on a studio wall',
	0,
	1,
	4
);

INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_ubud_gold_xs', 'prod_ubud_gold', 'XS', 99, 0);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_ubud_gold_s', 'prod_ubud_gold', 'S', 99, 1);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_ubud_gold_m', 'prod_ubud_gold', 'M', 99, 2);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_ubud_gold_l', 'prod_ubud_gold', 'L', 99, 3);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_ubud_gold_xl', 'prod_ubud_gold', 'XL', 99, 4);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_ubud_gold_xxl', 'prod_ubud_gold', 'XXL', 99, 5);

INSERT INTO `product` (`id`, `slug`, `name`, `color`, `color_hex`, `price`, `description`, `fabric`, `features`, `image`, `images`, `image_alt`, `pre_order`, `active`, `sort_order`) VALUES (
	'prod_bunch_stripe',
	'bunch-stripe',
	'Bunch Stripe',
	'Stripe',
	'#1c4a8c',
	920000,
	'Black with a white hoop across the chest. The stripe the bunch can find from the back of the group — keep together, even when the road kicks.',
	'Italian polyester, silicone hem',
	'["Race-fit club cut for Bali heat","Three rear pockets","Full-length YKK zipper","Mesh side panels for breathability","Silicone grippers at sleeve cuffs and hem","UV-treated polyester","White chest stripe for bunch visibility","Silicone hem to stay tucked on climbs"]',
	'https://cdn.shopify.com/s/files/1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PRODUCT_CARD_HERO.jpg',
	'["https://cdn.shopify.com/s/files/1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PRODUCT_CARD_HERO.jpg","https://cdn.shopify.com/s/files/1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PRODUCT_CARD_ALT.jpg","https://cdn.shopify.com/s/files/1/1431/8222/products/Male-Jersey-FatStripeTeam-White-MAJ180_maap-cycling-apparel_PDP_LIFESTYLE_01_DESKTOP.jpg"]',
	'Striped short-sleeve cycling jersey on a studio wall',
	1,
	1,
	5
);

INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_bunch_stripe_xs', 'prod_bunch_stripe', 'XS', 0, 0);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_bunch_stripe_s', 'prod_bunch_stripe', 'S', 0, 1);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_bunch_stripe_m', 'prod_bunch_stripe', 'M', 0, 2);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_bunch_stripe_l', 'prod_bunch_stripe', 'L', 0, 3);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_bunch_stripe_xl', 'prod_bunch_stripe', 'XL', 0, 4);
INSERT INTO `product_size` (`id`, `product_id`, `size`, `stock`, `sort_order`) VALUES ('prod_bunch_stripe_xxl', 'prod_bunch_stripe', 'XXL', 0, 5);

