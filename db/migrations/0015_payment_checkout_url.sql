-- Migration number: 0015 	 2026-09-15T04:04:25.000Z

ALTER TABLE `payment` ADD `checkout_url` text;

UPDATE `payment`
SET `checkout_url` = json_extract(`payload`, '$.checkoutUrl')
WHERE `checkout_url` IS NULL
  AND json_extract(`payload`, '$.checkoutUrl') IS NOT NULL;
