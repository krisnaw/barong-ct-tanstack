-- Migration number: 0013 	 2026-09-14T08:10:00.000Z

ALTER TABLE `product` ADD `members_only` integer DEFAULT false NOT NULL;
