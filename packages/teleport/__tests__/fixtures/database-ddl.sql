CREATE TABLE `migrations` (
	`id` integer not null,
	`name` varchar(100) not null,
	PRIMARY KEY (`id`)
);

CREATE TABLE `users` (
	`id` varchar(24) not null,
	`gid` varchar(255) not null,
	`first_name` varchar(100) not null,
	`last_name` varchar(100) null,
	`email` varchar(255) not null,
	`created_at` datetime not null,
	`updated_at` datetime not null,
	`settings` text not null default '{}',
	`total_school_changes` tinyint null default '0',
	`donated_at` datetime null default null,
	PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS "courses" (
	`id` varchar(24) NOT NULL,
	`user_id` varchar(24) NOT NULL,
	`semester` varchar(5) NOT NULL,
	`name` varchar(100) NOT NULL,
	`credit_hours` tinyint NULL DEFAULT null,
	`cutoffs` json DEFAULT '{}',
	`settings` text NULL DEFAULT '{}',
	PRIMARY KEY (`id`),
	FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

CREATE TABLE `categories` (
	`id` varchar(24) not null,
	`course_id` varchar(24) not null,
	`name` varchar(50) null,
	`weight` float null,
	`position` integer null,
	`dropped_grades` tinyint null default null,
	PRIMARY KEY (`id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
);

CREATE TABLE `grades` (
	`id` varchar(24) not null,
	`user_id` varchar(24) not null,
	`course_id` varchar(24) not null,
	`category_id` varchar(24) not null,
	`name` varchar(50) null,
	`grade` float null,
	PRIMARY KEY (`id`),
	FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
	FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
);
