import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  longtext,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for admin features.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Industry categories for video classification.
 * Admins can create custom categories like "广告", "品宣", "美业", etc.
 */
export const industryCategories = mysqlTable(
  "industry_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 20 }).default("#3B82F6"),
    isDefault: boolean("isDefault").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_userId").on(table.userId),
    index("idx_isDefault").on(table.isDefault),
  ]
);

export type IndustryCategory = typeof industryCategories.$inferSelect;
export type InsertIndustryCategory = typeof industryCategories.$inferInsert;

/**
 * Search keywords for each industry category.
 * Multiple keywords per category to support diverse searches.
 */
export const searchKeywords = mysqlTable(
  "search_keywords",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull(),
    keyword: varchar("keyword", { length: 200 }).notNull(),
    priority: int("priority").default(0),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_categoryId").on(table.categoryId),
    index("idx_isActive").on(table.isActive),
  ]
);

export type SearchKeyword = typeof searchKeywords.$inferSelect;
export type InsertSearchKeyword = typeof searchKeywords.$inferInsert;

/**
 * Collection tasks for automated video scraping.
 * Tracks task status, configuration, and execution history.
 */
export const collectionTasks = mysqlTable(
  "collection_tasks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    categoryId: int("categoryId").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", [
      "pending",
      "running",
      "paused",
      "completed",
      "failed",
    ])
      .default("pending")
      .notNull(),
    progress: int("progress").default(0),
    totalVideos: int("totalVideos").default(0),
    collectedVideos: int("collectedVideos").default(0),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    errorMessage: text("errorMessage"),
    config: json("config").$type<{
      keywords: string[];
      maxResults: number;
      daysFilter: number;
    }>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_userId").on(table.userId),
    index("idx_status").on(table.status),
    index("idx_categoryId").on(table.categoryId),
  ]
);

export type CollectionTask = typeof collectionTasks.$inferSelect;
export type InsertCollectionTask = typeof collectionTasks.$inferInsert;

/**
 * Collected video data from Douyin.
 * Stores all metadata and engagement metrics.
 */
export const douyinVideos = mysqlTable(
  "douyin_videos",
  {
    id: int("id").autoincrement().primaryKey(),
    taskId: int("taskId").notNull(),
    userId: int("userId").notNull(),
    categoryId: int("categoryId").notNull(),
    videoId: varchar("videoId", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: longtext("description"),
    authorId: varchar("authorId", { length: 100 }),
    authorName: varchar("authorName", { length: 200 }),
    authorAvatar: text("authorAvatar"),
    videoUrl: text("videoUrl").notNull(),
    coverImage: text("coverImage"),
    likes: int("likes").default(0),
    comments: int("comments").default(0),
    shares: int("shares").default(0),
    views: int("views").default(0),
    publishedAt: timestamp("publishedAt"),
    collectedAt: timestamp("collectedAt").defaultNow().notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_taskId").on(table.taskId),
    index("idx_userId").on(table.userId),
    index("idx_categoryId").on(table.categoryId),
    index("idx_publishedAt").on(table.publishedAt),
    index("idx_likes").on(table.likes),
    index("idx_comments").on(table.comments),
  ]
);

export type DouyinVideo = typeof douyinVideos.$inferSelect;
export type InsertDouyinVideo = typeof douyinVideos.$inferInsert;

/**
 * AI-powered copywriting analysis results.
 * Stores analysis from OpenAI for video copy insights.
 */
export const videoAnalysis = mysqlTable(
  "video_analysis",
  {
    id: int("id").autoincrement().primaryKey(),
    videoId: int("videoId").notNull(),
    userId: int("userId").notNull(),
    hook: text("hook"),
    structure: text("structure"),
    emotionalGuidance: text("emotionalGuidance"),
    callToAction: text("callToAction"),
    keyInsights: json("keyInsights").$type<string[]>(),
    recommendations: json("recommendations").$type<string[]>(),
    overallScore: decimal("overallScore", { precision: 3, scale: 2 }),
    rawAnalysis: longtext("rawAnalysis"),
    analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_videoId").on(table.videoId),
    index("idx_userId").on(table.userId),
  ]
);

export type VideoAnalysis = typeof videoAnalysis.$inferSelect;
export type InsertVideoAnalysis = typeof videoAnalysis.$inferInsert;

/**
 * Export history for data exports (Excel/CSV).
 * Tracks all export operations for audit and recovery.
 */
export const exportHistory = mysqlTable(
  "export_history",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    taskId: int("taskId"),
    format: mysqlEnum("format", ["excel", "csv"]).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileUrl: text("fileUrl"),
    recordCount: int("recordCount").default(0),
    status: mysqlEnum("status", ["pending", "completed", "failed"])
      .default("pending")
      .notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => [
    index("idx_userId").on(table.userId),
    index("idx_taskId").on(table.taskId),
    index("idx_status").on(table.status),
  ]
);

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;

/**
 * Collection task logs for detailed execution tracking.
 * Records each step of the collection process for debugging.
 */
export const collectionLogs = mysqlTable(
  "collection_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    taskId: int("taskId").notNull(),
    level: mysqlEnum("level", ["info", "warning", "error"]).default("info"),
    message: text("message").notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_taskId").on(table.taskId),
    index("idx_level").on(table.level),
    index("idx_createdAt").on(table.createdAt),
  ]
);

export type CollectionLog = typeof collectionLogs.$inferSelect;
export type InsertCollectionLog = typeof collectionLogs.$inferInsert;
