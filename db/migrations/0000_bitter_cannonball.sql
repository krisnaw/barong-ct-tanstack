CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`phone` text,
	`gender` text,
	`blood_type` text,
	`date_of_birth` text,
	`nationality` text,
	`id_number` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`jersey_size` text DEFAULT 'M',
	`address` text,
	`apartment` text,
	`city` text,
	`province` text DEFAULT 'Bali',
	`postal` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `user_shipping_address_userId_idx` ON `user_shipping_address` (`user_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `event_category` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`distance` text,
	`price` integer DEFAULT 0 NOT NULL,
	`service_fee` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`max_participants` integer,
	`gpx_route` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_category_eventId_idx` ON `event_category` (`event_id`);--> statement-breakpoint
CREATE TABLE `event_checkpoint` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_checkpoint_eventId_idx` ON `event_checkpoint` (`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_checkpoint_event_name_uidx` ON `event_checkpoint` (`event_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_checkpoint_event_sort_uidx` ON `event_checkpoint` (`event_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `checkpoint_category` (
	`checkpoint_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`checkpoint_id`, `category_id`),
	FOREIGN KEY (`checkpoint_id`) REFERENCES `event_checkpoint`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `event_category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `checkpoint_checkin` (
	`id` text PRIMARY KEY NOT NULL,
	`checkpoint_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`checked_in_at` integer NOT NULL,
	`checked_in_by` text,
	FOREIGN KEY (`checkpoint_id`) REFERENCES `event_checkpoint`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `event_participant`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`checked_in_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `checkpoint_checkin_checkpointId_idx` ON `checkpoint_checkin` (`checkpoint_id`);--> statement-breakpoint
CREATE INDEX `checkpoint_checkin_participantId_idx` ON `checkpoint_checkin` (`participant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `checkpoint_checkin_checkpoint_participant_uidx` ON `checkpoint_checkin` (`checkpoint_id`,`participant_id`);--> statement-breakpoint
CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`regulation` text,
	`feature_image` text,
	`feature_image_alt` text,
	`kind` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text DEFAULT '05:30' NOT NULL,
	`time_zone` text DEFAULT 'GMT+8' NOT NULL,
	`location_name` text NOT NULL,
	`location_address` text,
	`registration_closes_at` text,
	`has_jersey` integer DEFAULT false NOT NULL,
	`is_group_ride` integer DEFAULT false NOT NULL,
	`group_capacity` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_slug_unique` ON `event` (`slug`);--> statement-breakpoint
CREATE INDEX `event_status_date_idx` ON `event` (`status`,`event_date`);--> statement-breakpoint
CREATE INDEX `event_kind_idx` ON `event` (`kind`);--> statement-breakpoint
CREATE TABLE `event_group` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`event_category_id` text,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_category_id`) REFERENCES `event_category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `event_group_eventId_idx` ON `event_group` (`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_group_event_name_uidx` ON `event_group` (`event_id`,`name`);--> statement-breakpoint
CREATE TABLE `event_participant` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`event_category_id` text,
	`event_group_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`bib_number` text,
	`jersey_size` text,
	`price` integer DEFAULT 0 NOT NULL,
	`service_fee` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`promo_id` text,
	`promo_code` text,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`final_price` integer DEFAULT 0 NOT NULL,
	`kit_collected_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_category_id`) REFERENCES `event_category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`event_group_id`) REFERENCES `event_group`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_participant_user_event_uidx` ON `event_participant` (`user_id`,`event_id`);--> statement-breakpoint
CREATE INDEX `event_participant_eventId_idx` ON `event_participant` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_participant_status_idx` ON `event_participant` (`status`);--> statement-breakpoint
CREATE TABLE `event_promo` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`promo` text NOT NULL,
	`discount_value` integer NOT NULL,
	`discount_type` text DEFAULT 'fixed' NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_promo_eventId_idx` ON `event_promo` (`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_promo_event_code_uidx` ON `event_promo` (`event_id`,`promo`);--> statement-breakpoint
CREATE TABLE `line_items` (
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
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `line_items_orderId_idx` ON `line_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
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
	`pickup_point_id` text,
	`shipping_speed` text NOT NULL,
	`shipping_label` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`discount_code` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`courier` text,
	`tracking_number` text,
	`placed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `user_shipping_address`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_point`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`number`);--> statement-breakpoint
CREATE INDEX `orders_userId_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_placed_at_idx` ON `orders` (`placed_at`);--> statement-breakpoint
CREATE INDEX `orders_pickup_point_id_idx` ON `orders` (`pickup_point_id`);--> statement-breakpoint
CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`participant_id` text,
	`provider` text NOT NULL,
	`transaction_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`method` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`checkout_url` text,
	`paid_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `event_participant`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_orderId_idx` ON `payment` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_participantId_idx` ON `payment` (`participant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_provider_transaction_uidx` ON `payment` (`provider`,`transaction_id`);--> statement-breakpoint
CREATE TABLE `pickup_point` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`province` text DEFAULT 'Bali' NOT NULL,
	`postal` text NOT NULL,
	`hours` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pickup_point_active_sort_idx` ON `pickup_point` (`active`,`sort_order`);--> statement-breakpoint
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
	`members_only` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_slug_unique` ON `product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_active_sort_idx` ON `product` (`active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_size` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_size_product_size_uidx` ON `product_size` (`product_id`,`size`);--> statement-breakpoint
CREATE INDEX `product_size_productId_idx` ON `product_size` (`product_id`);