-- Migration number: 0011 	 2026-09-14T06:54:00.000Z

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

CREATE INDEX `pickup_point_active_sort_idx` ON `pickup_point` (`active`, `sort_order`);
