import { eq, and, desc, gte, lte, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  InsertIndustryCategory,
  industryCategories,
  InsertSearchKeyword,
  searchKeywords,
  InsertCollectionTask,
  collectionTasks,
  InsertDouyinVideo,
  douyinVideos,
  InsertVideoAnalysis,
  videoAnalysis,
  InsertExportHistory,
  exportHistory,
  InsertCollectionLog,
  collectionLogs,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Management ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Industry Categories ============

export async function createIndustryCategory(
  data: InsertIndustryCategory
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(industryCategories).values(data);
  return result;
}

export async function getIndustryCategoriesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(industryCategories)
    .where(eq(industryCategories.userId, userId))
    .orderBy(desc(industryCategories.createdAt));
}

export async function getIndustryCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(industryCategories)
    .where(eq(industryCategories.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateIndustryCategory(
  id: number,
  data: Partial<InsertIndustryCategory>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(industryCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(industryCategories.id, id));
}

export async function deleteIndustryCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(industryCategories)
    .where(eq(industryCategories.id, id));
}

// ============ Search Keywords ============

export async function createSearchKeyword(data: InsertSearchKeyword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(searchKeywords).values(data);
}

export async function getKeywordsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(searchKeywords)
    .where(eq(searchKeywords.categoryId, categoryId))
    .orderBy(desc(searchKeywords.priority));
}

export async function updateSearchKeyword(
  id: number,
  data: Partial<InsertSearchKeyword>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(searchKeywords)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(searchKeywords.id, id));
}

export async function deleteSearchKeyword(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(searchKeywords).where(eq(searchKeywords.id, id));
}

// ============ Collection Tasks ============

export async function createCollectionTask(data: InsertCollectionTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(collectionTasks).values(data);
  return result;
}

export async function getCollectionTasksByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(collectionTasks)
    .where(eq(collectionTasks.userId, userId))
    .orderBy(desc(collectionTasks.createdAt));
}

export async function getCollectionTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(collectionTasks)
    .where(eq(collectionTasks.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateCollectionTask(
  id: number,
  data: Partial<InsertCollectionTask>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(collectionTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(collectionTasks.id, id));
}

// ============ Douyin Videos ============

export async function createDouyinVideo(data: InsertDouyinVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(douyinVideos).values(data);
}

export async function getVideosByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(douyinVideos)
    .where(eq(douyinVideos.taskId, taskId))
    .orderBy(desc(douyinVideos.likes));
}

export async function getVideosByCategory(
  categoryId: number,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(douyinVideos)
    .where(eq(douyinVideos.categoryId, categoryId))
    .orderBy(desc(douyinVideos.likes))
    .limit(limit)
    .offset(offset);
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(douyinVideos)
    .where(eq(douyinVideos.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getVideosByUser(
  userId: number,
  limit: number = 100,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(douyinVideos)
    .where(eq(douyinVideos.userId, userId))
    .orderBy(desc(douyinVideos.likes))
    .limit(limit)
    .offset(offset);
}

export async function searchVideos(
  userId: number,
  query: string,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(douyinVideos)
    .where(
      and(
        eq(douyinVideos.userId, userId),
        like(douyinVideos.title, `%${query}%`)
      )
    )
    .orderBy(desc(douyinVideos.likes))
    .limit(limit);
}

// ============ Video Analysis ============

export async function createVideoAnalysis(data: InsertVideoAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(videoAnalysis).values(data);
}

export async function getAnalysisByVideoId(videoId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(videoAnalysis)
    .where(eq(videoAnalysis.videoId, videoId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getAnalysisByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(videoAnalysis)
    .where(eq(videoAnalysis.userId, userId))
    .orderBy(desc(videoAnalysis.analyzedAt));
}

export async function updateVideoAnalysis(
  id: number,
  data: Partial<InsertVideoAnalysis>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(videoAnalysis)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(videoAnalysis.id, id));
}

// ============ Export History ============

export async function createExportRecord(data: InsertExportHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(exportHistory).values(data);
}

export async function getExportHistoryByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(exportHistory)
    .where(eq(exportHistory.userId, userId))
    .orderBy(desc(exportHistory.createdAt));
}

export async function updateExportRecord(
  id: number,
  data: Partial<InsertExportHistory>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(exportHistory)
    .set({ ...data, completedAt: new Date() })
    .where(eq(exportHistory.id, id));
}

// ============ Collection Logs ============

export async function createCollectionLog(data: InsertCollectionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(collectionLogs).values(data);
}

export async function getLogsByTask(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(collectionLogs)
    .where(eq(collectionLogs.taskId, taskId))
    .orderBy(desc(collectionLogs.createdAt));
}
