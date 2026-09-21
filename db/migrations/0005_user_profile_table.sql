-- Migration number: 0005 	 2026-09-10T08:45:00.000Z

CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`phone` text,
	`jersey_size` text DEFAULT 'M',
	`address` text,
	`apartment` text,
	`city` text,
	`province` text DEFAULT 'Bali',
	`postal` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT INTO `user_profile` (
	`user_id`,
	`first_name`,
	`last_name`,
	`phone`,
	`jersey_size`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`first_name`,
	`last_name`,
	`phone`,
	COALESCE(`jersey_size`, 'M'),
	COALESCE(`created_at`, cast(unixepoch('subsecond') * 1000 as integer)),
	COALESCE(`updated_at`, cast(unixepoch('subsecond') * 1000 as integer))
FROM `user`;

ALTER TABLE `user` DROP COLUMN `first_name`;
ALTER TABLE `user` DROP COLUMN `last_name`;
ALTER TABLE `user` DROP COLUMN `phone`;
ALTER TABLE `user` DROP COLUMN `jersey_size`;
