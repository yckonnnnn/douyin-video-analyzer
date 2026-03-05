import { chromium, Browser, Page } from "playwright";

/**
 * 抖音视频数据接口
 */
export interface DouyinVideo {
  videoId: string;
  title: string;
  description: string;
  authorName: string;
  authorId: string;
  likes: number;
  comments: number;
  shares: number;
  videoUrl: string;
  coverImage?: string;
  publishedAt: Date;
}

/**
 * 采集进度回调函数
 */
export type ProgressCallback = (progress: {
  current: number;
  total: number;
  status: "searching" | "collecting" | "completed" | "error";
  message: string;
}) => Promise<void>;

/**
 * 抖音视频采集器
 */
export class DouyinCollector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * 初始化浏览器
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
        ],
      });

      this.page = await this.browser.newPage({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1920, height: 1080 },
      });
    } catch (error) {
      console.error("[DouyinCollector] Failed to initialize browser:", error);
      throw error;
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * 采集抖音视频
   * @param keywords 搜索关键词列表
   * @param maxResults 最多采集数量
   * @param daysFilter 只采集多少天内的视频（天数）
   * @param onProgress 进度回调函数
   */
  async collect(
    keywords: string[],
    maxResults: number = 100,
    daysFilter: number = 15,
    onProgress?: ProgressCallback
  ): Promise<DouyinVideo[]> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    const allVideos: DouyinVideo[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysFilter);

    try {
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];

        if (onProgress) {
          await onProgress({
            current: i,
            total: keywords.length,
            status: "searching",
            message: `正在搜索关键词: ${keyword}`,
          });
        }

        try {
          const videos = await this.searchAndCollect(
            keyword,
            maxResults - allVideos.length,
            cutoffDate
          );

          allVideos.push(...videos);

          if (allVideos.length >= maxResults) {
            break;
          }
        } catch (error) {
          console.error(
            `[DouyinCollector] Error collecting videos for keyword "${keyword}":`,
            error
          );
          // 继续处理下一个关键词
          continue;
        }
      }

      if (onProgress) {
        await onProgress({
          current: allVideos.length,
          total: allVideos.length,
          status: "completed",
          message: `采集完成，共获得 ${allVideos.length} 个视频`,
        });
      }

      return allVideos;
    } catch (error) {
      if (onProgress) {
        await onProgress({
          current: allVideos.length,
          total: maxResults,
          status: "error",
          message: `采集出错: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
      throw error;
    }
  }

  /**
   * 搜索并采集单个关键词的视频
   */
  private async searchAndCollect(
    keyword: string,
    limit: number,
    cutoffDate: Date
  ): Promise<DouyinVideo[]> {
    if (!this.page) {
      throw new Error("Page not available");
    }

    const videos: DouyinVideo[] = [];

    try {
      // 访问抖音搜索页面
      const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`;
      await this.page.goto(searchUrl, { waitUntil: "networkidle" });

      // 等待视频列表加载
      await this.page
        .locator("[data-e2e='video-feed'] [data-e2e='video-card']")
        .first()
        .waitFor({ timeout: 10000 })
        .catch(() => {
          console.warn("[DouyinCollector] Video feed selector not found");
        });

      // 滚动加载更多视频
      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 10;

      while (videos.length < limit && scrollAttempts < maxScrollAttempts) {
        // 获取当前页面的所有视频卡片
        const videoElements = await this.page
          .locator("[data-e2e='video-feed'] [data-e2e='video-card']")
          .all();

        // 提取视频信息
        for (const element of videoElements) {
          if (videos.length >= limit) break;

          try {
            const videoData = await this.extractVideoData(element);
            if (videoData && videoData.publishedAt >= cutoffDate) {
              // 检查是否已存在
              if (!videos.find((v) => v.videoId === videoData.videoId)) {
                videos.push(videoData);
              }
            }
          } catch (error) {
            console.warn("[DouyinCollector] Failed to extract video data:", error);
            continue;
          }
        }

        // 滚动到页面底部
        const currentHeight = await this.page.evaluate(
          () => document.documentElement.scrollHeight
        );

        if (currentHeight === previousHeight) {
          // 没有新内容加载，停止滚动
          break;
        }

        previousHeight = currentHeight;
        await this.page.evaluate(() =>
          window.scrollBy(0, window.innerHeight)
        );
        await this.page.waitForTimeout(1000); // 等待新内容加载
        scrollAttempts++;
      }

      return videos;
    } catch (error) {
      console.error(
        `[DouyinCollector] Error searching for keyword "${keyword}":`,
        error
      );
      return videos;
    }
  }

  /**
   * 从视频元素中提取数据
   */
  private async extractVideoData(element: any): Promise<DouyinVideo | null> {
    try {
      // 获取视频链接
      const linkElement = element.locator("a").first();
      const href = await linkElement.getAttribute("href");

      if (!href) return null;

      // 提取视频 ID
      const videoIdMatch = href.match(/\/video\/(\d+)/);
      if (!videoIdMatch) return null;

      const videoId = videoIdMatch[1];

      // 获取视频标题
      const titleElement = element.locator("[data-e2e='video-desc']").first();
      const title = await titleElement.textContent();

      // 获取作者信息
      const authorElement = element
        .locator("[data-e2e='video-author-name']")
        .first();
      const authorName = await authorElement.textContent();

      // 获取互动数据（点赞、评论、分享）
      const statsElements = await element
        .locator("[data-e2e='video-stat']")
        .all();

      let likes = 0;
      let comments = 0;
      let shares = 0;

      for (const stat of statsElements) {
        const text = (await stat.textContent()) || "";
        if (text.includes("赞")) {
          likes = this.parseNumber(text);
        } else if (text.includes("评")) {
          comments = this.parseNumber(text);
        } else if (text.includes("分享")) {
          shares = this.parseNumber(text);
        }
      }

      // 获取封面图片
      const coverElement = element.locator("img").first();
      const coverImage = await coverElement.getAttribute("src");

      // 获取发布时间（这里需要点击视频详情页获取）
      const publishedAt = new Date(); // 默认当前时间，实际应该从详情页获取

      return {
        videoId,
        title: title || "未知标题",
        description: title || "",
        authorName: authorName || "未知作者",
        authorId: `author_${videoId}`,
        likes,
        comments,
        shares,
        videoUrl: `https://www.douyin.com${href}`,
        coverImage: coverImage || undefined,
        publishedAt,
      };
    } catch (error) {
      console.warn("[DouyinCollector] Error extracting video data:", error);
      return null;
    }
  }

  /**
   * 解析数字文本（如"1.2万" -> 12000）
   */
  private parseNumber(text: string): number {
    const match = text.match(/(\d+\.?\d*)(万|千|百)?/);
    if (!match) return 0;

    let num = parseFloat(match[1]);
    const unit = match[2];

    if (unit === "万") num *= 10000;
    else if (unit === "千") num *= 1000;
    else if (unit === "百") num *= 100;

    return Math.floor(num);
  }
}

/**
 * 创建采集器实例并执行采集任务
 */
export async function collectDouyinVideos(
  keywords: string[],
  options: {
    maxResults?: number;
    daysFilter?: number;
    onProgress?: ProgressCallback;
  } = {}
): Promise<DouyinVideo[]> {
  const collector = new DouyinCollector();

  try {
    await collector.initialize();

    const videos = await collector.collect(
      keywords,
      options.maxResults || 100,
      options.daysFilter || 15,
      options.onProgress
    );

    return videos;
  } finally {
    await collector.close();
  }
}
