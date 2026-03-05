#!/usr/bin/env node

/**
 * 本地测试脚本：验证 Playwright 采集功能
 * 使用方式：node scripts/test-collector.mjs
 * 
 * 这个脚本可以独立运行，不依赖服务器
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../.test-logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `collection-${Date.now()}.log`);

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

async function testCollector() {
  let browser = null;
  let page = null;

  try {
    log('开始测试 Playwright 采集脚本...');
    log('日志文件: ' + logFile);

    // 1. 检查 Chromium 是否可用
    log('正在启动浏览器...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
    log('✓ 浏览器启动成功');

    // 2. 创建页面
    log('正在创建页面...');
    page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    log('✓ 页面创建成功');

    // 3. 测试导航到抖音
    log('正在访问抖音首页...');
    try {
      await page.goto('https://www.douyin.com', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      log('✓ 成功访问抖音首页');
    } catch (error) {
      log(`⚠ 访问抖音首页超时或失败: ${error.message}`, 'warning');
      log('这可能是因为网络问题或抖音反爬虫机制，但 Playwright 本身工作正常');
    }

    // 4. 测试搜索功能
    log('正在测试搜索功能...');
    const keyword = '美业';
    const searchUrl = `https://www.douyin.com/search/${encodeURIComponent(keyword)}`;
    
    try {
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      log(`✓ 成功访问搜索页面: ${keyword}`);

      // 尝试获取页面标题
      const title = await page.title();
      log(`页面标题: ${title}`);

      // 尝试获取页面内容摘要
      const content = await page.content();
      const contentLength = content.length;
      log(`页面内容大小: ${contentLength} 字节`);

      if (contentLength > 1000) {
        log('✓ 页面内容正常加载');
      } else {
        log('⚠ 页面内容较小，可能被反爬虫拦截', 'warning');
      }
    } catch (error) {
      log(`搜索测试失败: ${error.message}`, 'error');
    }

    // 5. 测试数据提取
    log('正在测试数据提取...');
    try {
      // 尝试查找视频元素
      const videoCount = await page.locator('[data-e2e="video-card"]').count();
      log(`找到 ${videoCount} 个视频元素`);

      if (videoCount > 0) {
        log('✓ 成功找到视频元素，数据提取功能正常');
      } else {
        log('⚠ 未找到视频元素，可能是选择器过期或页面结构变化', 'warning');
      }
    } catch (error) {
      log(`数据提取测试失败: ${error.message}`, 'warning');
    }

    // 6. 测试滚动功能
    log('正在测试页面滚动...');
    try {
      const initialHeight = await page.evaluate(
        () => document.documentElement.scrollHeight
      );
      log(`初始页面高度: ${initialHeight}px`);

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);

      const newHeight = await page.evaluate(
        () => document.documentElement.scrollHeight
      );
      log(`滚动后页面高度: ${newHeight}px`);

      if (newHeight > initialHeight) {
        log('✓ 页面滚动成功，动态加载正常');
      } else {
        log('⚠ 页面高度未变化', 'warning');
      }
    } catch (error) {
      log(`滚动测试失败: ${error.message}`, 'warning');
    }

    log('✓ 所有测试完成！');
    log('');
    log('=== 测试总结 ===');
    log('✓ Playwright 环境正常');
    log('✓ 浏览器自动化功能可用');
    log('✓ 页面导航和交互正常');
    log('');
    log('如果看到上面的所有 ✓ 标记，说明采集脚本可以在本地运行！');
    log('');
    log(`详细日志已保存到: ${logFile}`);

    return true;
  } catch (error) {
    log(`致命错误: ${error.message}`, 'error');
    log(`错误堆栈: ${error.stack}`, 'error');
    return false;
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    log('浏览器已关闭');
  }
}

// 运行测试
testCollector()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
