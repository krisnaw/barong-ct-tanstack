-- Migration number: 0012 	 2026-09-14T07:10:00.000Z

ALTER TABLE `orders` ADD `pickup_point_id` text REFERENCES `pickup_point`(`id`) ON DELETE SET NULL;

CREATE INDEX `orders_pickup_point_id_idx` ON `orders` (`pickup_point_id`);
