import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: `test${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Categories Router", () => {
  it("should create a new industry category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.create({
      name: "广告",
      description: "广告相关视频分类",
      color: "#FF6B6B",
    });

    expect(result).toBeDefined();
  });

  it("should list categories for a user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a category first
    await caller.categories.create({
      name: "品宣",
      description: "品牌宣传视频",
    });

    // List categories
    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
  });

  it("should prevent unauthorized access to other user's categories", async () => {
    const ctx1 = createTestContext(1);
    const ctx2 = createTestContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a category
    const result = await caller1.categories.create({
      name: "美业",
      description: "美业相关视频",
    });

    // Try to access with User 2 (should fail)
    try {
      await caller2.categories.getById({ id: 1 });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Search Keywords Router", () => {
  it("should create a search keyword for a category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create category first
    const categoryResult = await caller.categories.create({
      name: "测试分类",
    });

    // Create keyword (assuming categoryId is 1 for test)
    const result = await caller.keywords.create({
      categoryId: 1,
      keyword: "抖音热门",
      priority: 1,
    });

    expect(result).toBeDefined();
  });
});

describe("Collection Tasks Router", () => {
  it("should create a collection task", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create category first
    await caller.categories.create({
      name: "采集测试",
    });

    // Create task
    const result = await caller.tasks.create({
      categoryId: 1,
      name: "2024年3月热门视频采集",
      description: "采集3月份的热门视频",
      config: {
        keywords: ["抖音热门", "爆款视频"],
        maxResults: 100,
        daysFilter: 15,
      },
    });

    expect(result).toBeDefined();
  });

  it("should update task status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create category and task first
    await caller.categories.create({ name: "状态测试" });
    await caller.tasks.create({
      categoryId: 1,
      name: "状态测试任务",
      config: {
        keywords: ["test"],
        maxResults: 50,
        daysFilter: 15,
      },
    });

    // Update status
    const result = await caller.tasks.updateStatus({
      id: 1,
      status: "running",
    });

    expect(result).toBeDefined();
  });
});

describe("Videos Router", () => {
  it("should list videos by category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create category first
    await caller.categories.create({ name: "视频测试" });

    // List videos (should be empty initially)
    const videos = await caller.videos.listByCategory({
      categoryId: 1,
    });

    expect(Array.isArray(videos)).toBe(true);
  });

  it("should search videos by query", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Search videos
    const videos = await caller.videos.search({
      query: "热门",
      limit: 10,
    });

    expect(Array.isArray(videos)).toBe(true);
  });
});

describe("Auth Router", () => {
  it("should return current user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.openId).toBe("test-user-1");
  });

  it("should logout user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
  });
});
