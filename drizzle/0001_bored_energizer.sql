CREATE TABLE `collection_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`level` enum('info','warning','error') DEFAULT 'info',
	`message` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`status` enum('pending','running','paused','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`totalVideos` int DEFAULT 0,
	`collectedVideos` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collection_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `douyin_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`videoId` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` longtext,
	`authorId` varchar(100),
	`authorName` varchar(200),
	`authorAvatar` text,
	`videoUrl` text NOT NULL,
	`coverImage` text,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`views` int DEFAULT 0,
	`publishedAt` timestamp,
	`collectedAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `douyin_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `douyin_videos_videoId_unique` UNIQUE(`videoId`)
);
--> statement-breakpoint
CREATE TABLE `export_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int,
	`format` enum('excel','csv') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text,
	`recordCount` int DEFAULT 0,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `export_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `industry_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(20) DEFAULT '#3B82F6',
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `industry_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`keyword` varchar(200) NOT NULL,
	`priority` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`hook` text,
	`structure` text,
	`emotionalGuidance` text,
	`callToAction` text,
	`keyInsights` json,
	`recommendations` json,
	`overallScore` decimal(3,2),
	`rawAnalysis` longtext,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_taskId` ON `collection_logs` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_level` ON `collection_logs` (`level`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `collection_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `collection_tasks` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `collection_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_categoryId` ON `collection_tasks` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_taskId` ON `douyin_videos` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `douyin_videos` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_categoryId` ON `douyin_videos` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_publishedAt` ON `douyin_videos` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `idx_likes` ON `douyin_videos` (`likes`);--> statement-breakpoint
CREATE INDEX `idx_comments` ON `douyin_videos` (`comments`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `export_history` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_taskId` ON `export_history` (`taskId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `export_history` (`status`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `industry_categories` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_isDefault` ON `industry_categories` (`isDefault`);--> statement-breakpoint
CREATE INDEX `idx_categoryId` ON `search_keywords` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_isActive` ON `search_keywords` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_videoId` ON `video_analysis` (`videoId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `video_analysis` (`userId`);