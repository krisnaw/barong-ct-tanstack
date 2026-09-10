-- Migration number: 0004 	 2026-09-10T08:30:00.000Z

ALTER TABLE `user` ADD `role` text;
ALTER TABLE `user` ADD `banned` integer DEFAULT false;
ALTER TABLE `user` ADD `ban_reason` text;
ALTER TABLE `user` ADD `ban_expires` integer;
ALTER TABLE `session` ADD `impersonated_by` text;
