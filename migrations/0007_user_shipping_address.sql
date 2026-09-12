-- Migration number: 0007 	 2026-09-12T07:30:00.000Z

CREATE TABLE `user_shipping_address` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`address` text,
	`apartment` text,
	`city` text,
	`province` text DEFAULT 'Bali',
	`postal` text,
	`is_default` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `user_shipping_address_userId_idx` ON `user_shipping_address` (`user_id`);
