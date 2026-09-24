CREATE TABLE `finance_expense` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`event_id` text,
	`note` text DEFAULT '' NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `finance_expense_date_idx` ON `finance_expense` (`date`);--> statement-breakpoint
CREATE INDEX `finance_expense_category_idx` ON `finance_expense` (`category`);--> statement-breakpoint
CREATE INDEX `finance_expense_event_id_idx` ON `finance_expense` (`event_id`);--> statement-breakpoint
CREATE TABLE `finance_income` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`source` text NOT NULL,
	`event_id` text,
	`note` text DEFAULT '' NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `finance_income_date_idx` ON `finance_income` (`date`);--> statement-breakpoint
CREATE INDEX `finance_income_source_idx` ON `finance_income` (`source`);--> statement-breakpoint
CREATE INDEX `finance_income_event_id_idx` ON `finance_income` (`event_id`);