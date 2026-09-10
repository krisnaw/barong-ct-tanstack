-- Migration number: 0003 	 2026-09-10T06:50:00.000Z

ALTER TABLE `user` ADD `first_name` text;
ALTER TABLE `user` ADD `last_name` text;
ALTER TABLE `user` ADD `phone` text;
ALTER TABLE `user` ADD `jersey_size` text DEFAULT 'M';
