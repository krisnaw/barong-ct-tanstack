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
