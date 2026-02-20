CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paperId` int,
	`contentId` int,
	`title` varchar(500) NOT NULL,
	`description` text,
	`platform` varchar(64),
	`scheduledAt` timestamp NOT NULL,
	`status` enum('scheduled','published','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paperId` int NOT NULL,
	`contentType` enum('twitter_thread','tiktok_script','linkedin_post','instagram_caption','blog_post','infographic_text','facebook_post','youtube_script','email_newsletter') NOT NULL,
	`generatedText` text NOT NULL,
	`tone` varchar(64),
	`model` varchar(128),
	`tokensUsed` int NOT NULL DEFAULT 0,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`abstract` text,
	`content` text,
	`contentFormat` enum('richtext','markdown','html') NOT NULL DEFAULT 'richtext',
	`authors` json,
	`keywords` json,
	`citations` json,
	`sourceFile` varchar(1024),
	`sourceType` enum('created','pdf','markdown','docx') NOT NULL DEFAULT 'created',
	`zenodoDepositId` varchar(64),
	`zenodoDoi` varchar(128),
	`ssrnId` varchar(64),
	`status` enum('draft','review','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `papers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`category` enum('billing','technical','refund','cancel','general') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenUsageLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`tokensUsed` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenUsageLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','starter','professional','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `tokensBalance` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tokensUsedThisMonth` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyTokenAllowance` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `accessibilitySettings` json;