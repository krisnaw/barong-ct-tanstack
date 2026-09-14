-- Migration number: 0010 	 2026-09-14T03:50:00.000Z

ALTER TABLE `orders` ADD `courier` text;
ALTER TABLE `orders` ADD `tracking_number` text;
