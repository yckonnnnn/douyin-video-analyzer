import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { CollectionService, executeCollectionTaskInBackground } from "./services/collectionService";

// ============ Validation Schemas ============

const createIndustryCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
});

const createSearchKeywordSchema = z.object({
  categoryId: z.number(),
  keyword: z.string().min(1).max(200),
  priority: z.number().optional(),
});

const createCollectionTaskSchema = z.object({
  categoryId: z.number(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  config: z.object({
    keywords: z.array(z.string()),
    maxResults: z.number().default(50),
    daysFilter: z.number().default(15),
  }),
});

const analyzeVideoSchema = z.object({
  videoId: z.number(),
});

const exportVideosSchema = z.object({
  taskId: z.number().optional(),
  categoryId: z.number().optional(),
  format: z.enum(["excel", "csv"]),
});

// ============ Industry Categories Router ============

const categoriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getIndustryCategoriesByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(createIndustryCategorySchema)
    .mutation(async ({ ctx, input }) => {
      return db.createIndustryCategory({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        color: input.color,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.id);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.updateIndustryCategory(input.id, {
        name: input.name,
        description: input.description,
        color: input.color,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.id);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.deleteIndustryCategory(input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.id);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return category;
    }),
});

// ============ Search Keywords Router ============

const keywordsRouter = router({
  listByCategory: protectedProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.categoryId);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getKeywordsByCategory(input.categoryId);
    }),

  create: protectedProcedure
    .input(createSearchKeywordSchema)
    .mutation(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.categoryId);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.createSearchKeyword({
        categoryId: input.categoryId,
        keyword: input.keyword,
        priority: input.priority,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        keyword: z.string().optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.updateSearchKeyword(input.id, {
        keyword: input.keyword,
        priority: input.priority,
        isActive: input.isActive,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteSearchKeyword(input.id);
    }),
});

// ============ Collection Tasks Router ============

const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getCollectionTasksByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(createCollectionTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.categoryId);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await db.createCollectionTask({
        userId: ctx.user.id,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        status: "pending",
        config: input.config,
      });

      return result;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await db.getCollectionTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return task;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "running", "paused", "completed", "failed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await db.getCollectionTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.status === "running") {
        updateData.startedAt = new Date();
      } else if (
        input.status === "completed" ||
        input.status === "failed"
      ) {
        updateData.completedAt = new Date();
      }

      return db.updateCollectionTask(input.id, updateData);
    }),

  getLogs: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await db.getCollectionTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getLogsByTask(input.taskId);
    }),
});

// ============ Videos Router ============

const videosRouter = router({
  listByTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await db.getCollectionTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getVideosByTask(input.taskId);
    }),

  listByCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const category = await db.getIndustryCategoryById(input.categoryId);
      if (!category || category.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getVideosByCategory(
        input.categoryId,
        input.limit || 100,
        input.offset || 0
      );
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return db.searchVideos(ctx.user.id, input.query, input.limit || 50);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const video = await db.getVideoById(input.id);
      if (!video || video.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return video;
    }),
});

// ============ Analysis Router ============

const analysisRouter = router({
  analyze: protectedProcedure
    .input(analyzeVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const video = await db.getVideoById(input.videoId);
      if (!video || video.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Check if analysis already exists
      const existing = await db.getAnalysisByVideoId(input.videoId);
      if (existing) {
        return existing;
      }

      // Call OpenAI API for analysis
      const analysisPrompt = `
你是一位专业的短视频文案分析师。请分析以下抖音视频文案，从以下维度提供深度洞察：

视频标题：${video.title}
视频描述：${video.description || "无"}

请从以下维度进行分析：
1. 钩子设计（Hook）：开头如何吸引注意力？使用了什么技巧？
2. 文案结构：整体文案如何组织？逻辑是否清晰？
3. 情绪引导：文案如何引导用户的情绪？使用了什么情感触发点？
4. 行动号召（CTA）：是否有明确的行动号召？效果如何？
5. 关键词与SEO：是否合理使用了关键词？
6. 整体评分：综合评分（0-10分）

请用JSON格式返回分析结果，包含以下字段：
{
  "hook": "钩子分析",
  "structure": "文案结构分析",
  "emotionalGuidance": "情绪引导分析",
  "callToAction": "行动号召分析",
  "keyInsights": ["洞察1", "洞察2", "洞察3"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "overallScore": 8.5
}
`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的短视频文案分析师，提供深度的文案洞察和可行的建议。" as string,
            },
            {
              role: "user",
              content: analysisPrompt as string,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "video_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  hook: { type: "string" },
                  structure: { type: "string" },
                  emotionalGuidance: { type: "string" },
                  callToAction: { type: "string" },
                  keyInsights: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } },
                  overallScore: { type: "number" },
                },
                required: [
                  "hook",
                  "structure",
                  "emotionalGuidance",
                  "callToAction",
                  "keyInsights",
                  "recommendations",
                  "overallScore",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        const contentStr = typeof response.choices[0]?.message.content === 'string'
          ? response.choices[0].message.content
          : JSON.stringify(response.choices[0]?.message.content || {});
        const analysisData = JSON.parse(contentStr || "{}");

        const result = await db.createVideoAnalysis({
          videoId: input.videoId,
          userId: ctx.user.id,
          hook: analysisData.hook,
          structure: analysisData.structure,
          emotionalGuidance: analysisData.emotionalGuidance,
          callToAction: analysisData.callToAction,
          keyInsights: analysisData.keyInsights,
          recommendations: analysisData.recommendations,
          overallScore: analysisData.overallScore,
          rawAnalysis: JSON.stringify(analysisData),
        });

        return result;
      } catch (error) {
        console.error("Analysis error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze video",
        });
      }
    }),

  getByVideoId: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const video = await db.getVideoById(input.videoId);
      if (!video || video.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getAnalysisByVideoId(input.videoId);
    }),

  listByUser: protectedProcedure.query(async ({ ctx }) => {
    return db.getAnalysisByUser(ctx.user.id);
  }),
});

// ============ Export Router ============

const exportRouter = router({
  export: protectedProcedure
    .input(exportVideosSchema)
    .mutation(async ({ ctx, input }) => {
      let videos = [];

      if (input.taskId) {
        const task = await db.getCollectionTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        videos = await db.getVideosByTask(input.taskId);
      } else if (input.categoryId) {
        const category = await db.getIndustryCategoryById(input.categoryId);
        if (!category || category.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        videos = await db.getVideosByCategory(input.categoryId, 10000, 0);
      } else {
        videos = await db.getVideosByUser(ctx.user.id, 10000, 0);
      }

      // Create export record
      const exportRecord = await db.createExportRecord({
        userId: ctx.user.id,
        taskId: input.taskId,
        format: input.format,
        fileName: `videos_${Date.now()}.${input.format === "excel" ? "xlsx" : "csv"}`,
        recordCount: videos.length,
        status: "pending",
      });

      // TODO: Implement actual file generation and upload to S3
      // For now, return the export record
      return exportRecord;
    }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return db.getExportHistoryByUser(ctx.user.id);
  }),
});

// ============ Main Router ============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  categories: categoriesRouter,
  keywords: keywordsRouter,
  tasks: tasksRouter,
  videos: videosRouter,
  analysis: analysisRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
