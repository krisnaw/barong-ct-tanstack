-- Migration number: 0018 	 2026-09-21T03:00:00.000Z

ALTER TABLE `event_participant` ADD `kit_collected_at` integer;

ALTER TABLE `payment` ADD `currency` text DEFAULT 'IDR' NOT NULL;
ALTER TABLE `payment` ADD `expires_at` integer;

UPDATE `payment`
SET `expires_at` = CAST(
  (julianday(json_extract(`payload`, '$.expiresAt')) - 2440587.5) * 86400000
  AS integer
)
WHERE `expires_at` IS NULL
  AND json_extract(`payload`, '$.expiresAt') IS NOT NULL;
