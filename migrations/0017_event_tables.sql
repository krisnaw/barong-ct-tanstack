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

CREATE TABLE `payment_new` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`participant_id` text,
	`provider` text NOT NULL,
	`transaction_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`method` text,
	`amount` integer NOT NULL,
	`checkout_url` text,
	`payload` text,
	`paid_at` integer,
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
	`checkout_url`,
	`payload`,
	`paid_at`,
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
	`checkout_url`,
	`payload`,
	`paid_at`,
	`created_at`,
	`updated_at`
FROM `payment`;

DROP TABLE `payment`;
ALTER TABLE `payment_new` RENAME TO `payment`;

CREATE INDEX `payment_orderId_idx` ON `payment` (`order_id`);
CREATE INDEX `payment_participantId_idx` ON `payment` (`participant_id`);
CREATE UNIQUE INDEX `payment_provider_transaction_uidx` ON `payment` (`provider`, `transaction_id`);

INSERT INTO `event` (
	`id`, `slug`, `name`, `description`, `feature_image`, `feature_image_alt`,
	`kind`, `status`, `event_date`, `event_time`, `time_zone`,
	`location_name`, `has_jersey`, `is_group_ride`, `group_capacity`
) VALUES
(
	'evt_melali_2027',
	'barong-melali-2027',
	'Barong Melali 2027',
	'Barong Melali returns as the club''s annual jalan-jalan across Gianyar. Long and short courses, a named group ride, and the same rule: keep the bunch together. Create a group, pick your course, choose a jersey size, then complete payment to lock your spot.',
	'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop',
	'A cyclist climbing an open country road toward the hills',
	'flagship',
	'open',
	'2027-08-28',
	'04:00',
	'GMT+8',
	'UC Silver, Batubulan',
	1,
	1,
	8
),
(
	'evt_climb_clinic',
	'climb-clinic-bedugul',
	'Climb Clinic — Bedugul',
	'A coached climbing session on the Bedugul approaches. Profile required, then pay to confirm your spot. Pace groups form on the day.',
	'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop',
	'Cyclists riding together on a mountain road',
	'paid',
	'open',
	'2026-10-12',
	'06:00',
	'GMT+8',
	'Bedugul meet point',
	0,
	0,
	NULL
),
(
	'evt_saturday_climax',
	'saturday-climax-kintamani',
	'Saturday Climax — Kintamani',
	'Saturday Climax is the club''s long social. No race, no drop if you stay in a group — just kilometres, coffee, and the climb to Kintamani.',
	'https://images.unsplash.com/photo-1517649763962-0c623066027e?auto=format&fit=crop',
	'A group of road cyclists on an open climb',
	'free',
	'open',
	'2026-09-20',
	'05:30',
	'GMT+8',
	'Denpasar meet point',
	0,
	0,
	NULL
),
(
	'evt_thursday_foreplay',
	'thursday-foreplay',
	'Thursday Foreplay',
	'Foreplay is the midweek social spin. Easy pace, no drop, coffee stop optional. Ideal if you are new to the club or easing back after time off the bike.',
	'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop',
	'Two cyclists riding together on a coastal road',
	'free',
	'open',
	'2026-09-25',
	'05:45',
	'GMT+8',
	'Denpasar meet point',
	0,
	0,
	NULL
);

INSERT INTO `event_category` (
	`id`, `event_id`, `name`, `description`, `distance`, `price`, `service_fee`, `max_participants`, `sort_order`
) VALUES
(
	'cat_melali_long',
	'evt_melali_2027',
	'Long course',
	'Sidemen, Besakih, Bukit Jambul — full Melali loop.',
	'145 km',
	350000,
	0,
	400,
	0
),
(
	'cat_melali_short',
	'evt_melali_2027',
	'Short course',
	'Shorter Gianyar loop — same bunch rules, less climbing.',
	'80 km',
	300000,
	0,
	400,
	1
),
(
	'cat_climb_open',
	'evt_climb_clinic',
	'Open',
	'Coached climb clinic entry.',
	'60 km',
	150000,
	0,
	30,
	0
),
(
	'cat_climax_open',
	'evt_saturday_climax',
	'Saturday Climax — Kintamani',
	'Open social ride.',
	'110 km',
	0,
	0,
	60,
	0
),
(
	'cat_foreplay_open',
	'evt_thursday_foreplay',
	'Thursday Foreplay',
	'Midweek social spin.',
	'55 km',
	0,
	0,
	40,
	0
);

INSERT INTO `event_group` (`id`, `event_id`, `event_category_id`, `name`) VALUES
('grp_melali_demo', 'evt_melali_2027', 'cat_melali_long', 'Peloton A');
