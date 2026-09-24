ALTER TABLE `orders` ADD `picked_up_at` integer;--> statement-breakpoint
CREATE INDEX `orders_picked_up_at_idx` ON `orders` (`picked_up_at`);