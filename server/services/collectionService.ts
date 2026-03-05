import { getDb } from "../db";
import {
  collectionTasks,
  douyinVideos,
  collectionLogs,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { collectDouyinVideos, DouyinVideo } from "../collectors/douyin";

/**
 * 采集任务执行服务
 */
export class CollectionService {
  /**
   * 执行采集任务
   */
  static async executeTask(taskId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      // 获取任务信息
      const task = await db
        .select()
        .from(collectionTasks)
        .where(
          and(
            eq(collectionTasks.id, taskId),
            eq(collectionTasks.userId, userId)
          )
        )
        .limit(1);

      if (!task || task.length === 0) {
        throw new Error("Task not found");
      }

      const taskData = task[0];

      // 更新任务状态为运行中
      await db
        .update(collectionTasks)
        .set({
          status: "running",
          startedAt: new Date(),
          collectedVideos: 0,
        })
        .where(eq(collectionTasks.id, taskId));

      // 记录日志
      await this.logCollection(
        taskId,
        userId,
        "info",
        "采集任务已启动"
      );

      // 获取搜索关键词
      const keywords = taskData.config?.keywords || [];
      if (keywords.length === 0) {
        throw new Error("No keywords configured for this task");
      }

      // 执行采集
      const videos = await collectDouyinVideos(keywords, {
        maxResults: taskData.config?.maxResults || 100,
        daysFilter: taskData.config?.daysFilter || 15,
        onProgress: async (progress) => {
          // 更新进度
          await db
            .update(collectionTasks)
            .set({
              collectedVideos: progress.current,
              totalVideos: progress.total,
            })
            .where(eq(collectionTasks.id, taskId));

          // 记录进度日志
          await this.logCollection(
            taskId,
            userId,
            "info",
            `${progress.message} (${progress.current}/${progress.total})`
          );
        },
      });

      // 保存采集到的视频
      for (const video of videos) {
        try {
          await db.insert(douyinVideos).values({
            taskId,
            userId,
            categoryId: taskData.categoryId,
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            authorName: video.authorName,
            authorId: video.authorId,
            likes: video.likes,
            comments: video.comments,
            shares: video.shares,
            videoUrl: video.videoUrl,
            coverImage: video.coverImage,
            publishedAt: video.publishedAt,
            collectedAt: new Date(),
          });
        } catch (error) {
          console.warn(
            `[CollectionService] Error saving video ${video.videoId}:`,
            error
          );
          // 继续保存其他视频
        }
      }

      // 更新任务状态为已完成
      await db
        .update(collectionTasks)
        .set({
          status: "completed",
          completedAt: new Date(),
          collectedVideos: videos.length,
          totalVideos: videos.length,
        })
        .where(eq(collectionTasks.id, taskId));

      // 记录完成日志
      await this.logCollection(
        taskId,
        userId,
        "info",
        `采集任务已完成，共采集 ${videos.length} 个视频`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // 更新任务状态为失败
      const db = await getDb();
      if (db) {
        await db
          .update(collectionTasks)
          .set({
            status: "failed",
            completedAt: new Date(),
          })
          .where(eq(collectionTasks.id, taskId));

        // 记录错误日志
        await this.logCollection(
          taskId,
          userId,
          "error",
          `采集任务失败: ${errorMessage}`
        );
      }

      throw error;
    }
  }

  /**
   * 暂停采集任务
   */
  static async pauseTask(taskId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(collectionTasks)
      .set({
        status: "paused",
      })
      .where(
        and(
          eq(collectionTasks.id, taskId),
          eq(collectionTasks.userId, userId)
        )
      );

    await this.logCollection(taskId, userId, "info", "采集任务已暂停");
  }

  /**
   * 恢复采集任务
   */
  static async resumeTask(taskId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .update(collectionTasks)
      .set({
        status: "running",
      })
      .where(
        and(
          eq(collectionTasks.id, taskId),
          eq(collectionTasks.userId, userId)
        )
      );

    await this.logCollection(taskId, userId, "info", "采集任务已恢复");
  }

  /**
   * 记录采集日志
   */
  static async logCollection(
    taskId: number,
    userId: number,
    level: "info" | "warning" | "error",
    message: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      console.warn("[CollectionService] Database not available for logging");
      return;
    }

    try {
      await db.insert(collectionLogs).values({
        taskId,
        level,
        message,
        metadata: { userId },
      });
    } catch (error) {
      console.error("[CollectionService] Error logging collection:", error);
    }
  }

  /**
   * 获取采集日志
   */
  static async getTaskLogs(
    taskId: number,
    userId: number,
    limit: number = 100
  ): Promise<any[]> {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const logs = await db
      .select()
      .from(collectionLogs)
      .where(eq(collectionLogs.taskId, taskId))
      .orderBy(collectionLogs.createdAt)
      .limit(limit);

    return logs.filter(
      (log) => (log.metadata as any)?.userId === userId
    );
  }
}

/**
 * 后台执行采集任务（使用 Promise，不阻塞 API 响应）
 */
export async function executeCollectionTaskInBackground(
  taskId: number,
  userId: number
): Promise<void> {
  // 在后台执行，不等待完成
  CollectionService.executeTask(taskId, userId).catch((error) => {
    console.error("[CollectionService] Background task failed:", error);
  });
}
