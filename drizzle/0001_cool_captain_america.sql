CREATE TABLE `caseLawCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(100),
	`caseName` varchar(512),
	`court` varchar(256),
	`year` int,
	`summary` text,
	`fullText` text,
	`courtListenerId` varchar(256),
	`scholarUrl` varchar(512),
	`isGoodLaw` int,
	`relatedCases` text,
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caseLawCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `caseLawCache_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `citations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`caseNumber` varchar(100),
	`caseName` varchar(512),
	`court` varchar(256),
	`year` int,
	`citationUrl` varchar(512),
	`bluebookFormat` text,
	`alwdFormat` text,
	`apaFormat` text,
	`mlaFormat` text,
	`chicagoFormat` text,
	`harvardFormat` text,
	`ieeeFormat` text,
	`isGoodLaw` int,
	`shepardizationStatus` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `citations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outletMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`outletId` int NOT NULL,
	`acceptanceProbability` int,
	`aiReasonings` text,
	`formatAdaptations` text,
	`isSubmitted` int DEFAULT 0,
	`submissionDate` timestamp,
	`status` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outletMatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outlets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`type` varchar(50),
	`category` varchar(100),
	`acceptanceCriteria` text,
	`editorialGuidelines` text,
	`contactEmail` varchar(256),
	`submissionUrl` varchar(512),
	`website` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outlets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`abstract` text,
	`content` text,
	`contentType` varchar(50) DEFAULT 'academic',
	`fileUrl` varchar(2048),
	`fileKey` varchar(512),
	`doi` varchar(256),
	`orcid` varchar(256),
	`authors` text,
	`keywords` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `papers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`apiUrl` varchar(512),
	`apiKey` varchar(512),
	`requiresAuth` int DEFAULT 0,
	`formatRequirements` text,
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platforms_id` PRIMARY KEY(`id`),
	CONSTRAINT `platforms_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`platformId` int NOT NULL,
	`status` varchar(50) DEFAULT 'pending',
	`submissionUrl` varchar(512),
	`externalId` varchar(256),
	`metadata` text,
	`error` text,
	`submittedAt` timestamp,
	`indexedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `citations` ADD CONSTRAINT `citations_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outletMatches` ADD CONSTRAINT `outletMatches_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outletMatches` ADD CONSTRAINT `outletMatches_outletId_outlets_id_fk` FOREIGN KEY (`outletId`) REFERENCES `outlets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `papers` ADD CONSTRAINT `papers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_platformId_platforms_id_fk` FOREIGN KEY (`platformId`) REFERENCES `platforms`(`id`) ON DELETE no action ON UPDATE no action;