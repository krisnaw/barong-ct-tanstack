CREATE TABLE `shop_promo` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_type` text DEFAULT 'percent' NOT NULL,
	`discount_value` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shop_promo_code_uidx` ON `shop_promo` (`code`);--> statement-breakpoint
ALTER TABLE `orders` ADD `promo_id` text REFERENCES shop_promo(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `orders_promo_id_idx` ON `orders` (`promo_id`);--> statement-breakpoint
INSERT INTO `shop_promo` (`id`, `code`, `discount_type`, `discount_value`)
VALUES
	('4f8c2a91-6d3e-4b17-9a55-1c0e7d2b8f04', 'BARONG10', 'percent', 10),
	('9b1e6c43-2a70-4f88-b6d1-5e3a9c04d217', 'MELALI', 'fixed', 50000);--> statement-breakpoint
UPDATE `orders`
SET `promo_id` = (
	SELECT `id` FROM `shop_promo`
	WHERE `shop_promo`.`code` = upper(`orders`.`discount_code`)
)
WHERE `discount_code` IS NOT NULL AND `promo_id` IS NULL;--> statement-breakpoint
UPDATE `shop_promo`
SET `used_count` = (
	SELECT COUNT(DISTINCT `orders`.`id`)
	FROM `orders`
	INNER JOIN `payment`
		ON `payment`.`order_id` = `orders`.`id`
		AND `payment`.`status` = 'paid'
	WHERE `orders`.`promo_id` = `shop_promo`.`id`
		AND `orders`.`status` NOT IN ('cancelled', 'refunded')
);