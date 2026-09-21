-- Migration number: 0017 	 2026-09-18T07:00:00.000Z

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

CREATE UNIQUE INDEX `event_slug_unique` ON `event` (`slug`);
CREATE INDEX `event_status_date_idx` ON `event` (`status`, `event_date`);
CREATE INDEX `event_kind_idx` ON `event` (`kind`);

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

CREATE INDEX `event_category_eventId_idx` ON `event_category` (`event_id`);

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

CREATE INDEX `event_group_eventId_idx` ON `event_group` (`event_id`);
CREATE UNIQUE INDEX `event_group_event_name_uidx` ON `event_group` (`event_id`, `name`);

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

CREATE UNIQUE INDEX `event_participant_user_event_uidx` ON `event_participant` (`user_id`, `event_id`);
CREATE INDEX `event_participant_eventId_idx` ON `event_participant` (`event_id`);
CREATE INDEX `event_participant_status_idx` ON `event_participant` (`status`);

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

CREATE INDEX `event_promo_eventId_idx` ON `event_promo` (`event_id`);
CREATE UNIQUE INDEX `event_promo_event_code_uidx` ON `event_promo` (`event_id`, `promo`);

CREATE TABLE `event_checkpoint` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `event_checkpoint_eventId_idx` ON `event_checkpoint` (`event_id`);
CREATE UNIQUE INDEX `event_checkpoint_event_name_uidx` ON `event_checkpoint` (`event_id`, `name`);
CREATE UNIQUE INDEX `event_checkpoint_event_sort_uidx` ON `event_checkpoint` (`event_id`, `sort_order`);

CREATE TABLE `checkpoint_category` (
	`checkpoint_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY (`checkpoint_id`, `category_id`),
	FOREIGN KEY (`checkpoint_id`) REFERENCES `event_checkpoint`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `event_category`(`id`) ON UPDATE no action ON DELETE cascade
);

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

CREATE INDEX `checkpoint_checkin_checkpointId_idx` ON `checkpoint_checkin` (`checkpoint_id`);
CREATE INDEX `checkpoint_checkin_participantId_idx` ON `checkpoint_checkin` (`participant_id`);
CREATE UNIQUE INDEX `checkpoint_checkin_checkpoint_participant_uidx` ON `checkpoint_checkin` (`checkpoint_id`, `participant_id`);

CREATE TABLE `payment_new` (
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

INSERT INTO `payment_new` (
	`id`,
	`order_id`,
	`participant_id`,
	`provider`,
	`transaction_id`,
	`status`,
	`method`,
	`amount`,
	`currency`,
	`checkout_url`,
	`paid_at`,
	`expires_at`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`order_id`,
	NULL,
	`provider`,
	`transaction_id`,
	`status`,
	`method`,
	`amount`,
	'IDR',
	`checkout_url`,
	`paid_at`,
	CAST(
		(julianday(json_extract(`payload`, '$.expiresAt')) - 2440587.5) * 86400000
		AS integer
	),
	`created_at`,
	`updated_at`
FROM `payment`;

DROP TABLE `payment`;
ALTER TABLE `payment_new` RENAME TO `payment`;

CREATE INDEX `payment_orderId_idx` ON `payment` (`order_id`);
CREATE INDEX `payment_participantId_idx` ON `payment` (`participant_id`);
CREATE UNIQUE INDEX `payment_provider_transaction_uidx` ON `payment` (`provider`, `transaction_id`);
