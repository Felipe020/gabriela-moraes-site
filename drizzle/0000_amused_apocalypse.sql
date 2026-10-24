CREATE TABLE `portfolio_items` (
	`kind` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`kind`, `slug`)
);
