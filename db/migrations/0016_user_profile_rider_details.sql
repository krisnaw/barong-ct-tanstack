-- Migration number: 0016 	 2026-09-15T06:06:52.000Z

ALTER TABLE `user_profile` ADD `gender` text;
ALTER TABLE `user_profile` ADD `blood_type` text;
ALTER TABLE `user_profile` ADD `date_of_birth` text;
ALTER TABLE `user_profile` ADD `nationality` text;
ALTER TABLE `user_profile` ADD `id_number` text;
ALTER TABLE `user_profile` ADD `emergency_contact_name` text;
ALTER TABLE `user_profile` ADD `emergency_contact_phone` text;
