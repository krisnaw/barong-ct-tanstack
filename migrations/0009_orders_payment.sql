-- Migration number: 0009 	 2026-09-12T08:45:00.000Z

ALTER TABLE `shop_order` RENAME TO `orders`;
ALTER TABLE `shop_order_line` RENAME TO `line_items`;

DROP INDEX IF EXISTS `shop_order_userId_idx`;
DROP INDEX IF EXISTS `shop_order_placed_at_idx`;
DROP INDEX IF EXISTS `shop_order_line_orderId_idx`;
DROP INDEX IF EXISTS `shop_order_number_unique`;

CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`number`);
CREATE INDEX `orders_userId_idx` ON `orders` (`user_id`);
CREATE INDEX `orders_placed_at_idx` ON `orders` (`placed_at`);
CREATE INDEX `line_items_orderId_idx` ON `line_items` (`order_id`);

ALTER TABLE `orders` DROP COLUMN `payment`;
ALTER TABLE `orders` DROP COLUMN `payment_provider`;
ALTER TABLE `orders` DROP COLUMN `doku_payment_id`;

CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`transaction_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`method` text,
	`amount` integer NOT NULL,
	`payload` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `payment_orderId_idx` ON `payment` (`order_id`);
CREATE UNIQUE INDEX `payment_provider_transaction_uidx` ON `payment` (`provider`, `transaction_id`);
