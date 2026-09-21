-- Migration number: 0008 	 2026-09-12T07:45:00.000Z

CREATE TABLE `shop_order` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`apartment` text,
	`city` text NOT NULL,
	`province` text NOT NULL,
	`postal` text NOT NULL,
	`shipping_address_id` text,
	`shipping_speed` text NOT NULL,
	`shipping_label` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`discount_code` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment` text DEFAULT 'unpaid' NOT NULL,
	`payment_provider` text DEFAULT 'doku' NOT NULL,
	`doku_payment_id` text,
	`placed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `user_shipping_address`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX `shop_order_number_unique` ON `shop_order` (`number`);
CREATE INDEX `shop_order_userId_idx` ON `shop_order` (`user_id`);
CREATE INDEX `shop_order_placed_at_idx` ON `shop_order` (`placed_at`);

CREATE TABLE `shop_order_line` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`image` text NOT NULL,
	`pre_order` integer DEFAULT false NOT NULL,
	`custom` text,
	FOREIGN KEY (`order_id`) REFERENCES `shop_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `shop_order_line_orderId_idx` ON `shop_order_line` (`order_id`);
