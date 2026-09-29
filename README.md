<div align="center">

# 🎬 抖音爆款视频采集与分析平台

**采集 → 分析 → 复用：用 AI 拆解爆款短视频文案规律的全栈工作台**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat&logo=mysql&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33?style=flat&logo=playwright&logoColor=white)
![Gemini](https://img.shields.io/badge/LLM-Gemini_2.5_Flash-4285F4?style=flat&logo=googlegemini&logoColor=white)

</div>

---

面向内容团队与电商运营的**短视频竞品分析工具**：按行业配置关键词，由 Playwright 无头浏览器自动采集抖音搜索结果中的爆款视频（点赞 / 评论 / 转发 / 发布时间，默认只保留 15 天内的内容），再由 LLM 对视频文案做六维爆款拆解，沉淀成可检索、可导出的选题素材库。

## ✨ 界面预览

| 仪表板 | 视频数据库 |
| :---: | :---: |
| ![dashboard](docs/screenshots/dashboard.png) | ![videos](docs/screenshots/videos.png) |
| **AI 文案拆解报告** | |
| ![analysis](docs/screenshots/analysis.png) | |

## 🧠 核心功能

### 🗂 行业分类与关键词管理
- 按行业（美食餐饮 / 美妆个护 / 知识付费……）组织监控方向，每个分类可挂多组搜索关键词并设置优先级

### ⚡ 自动化采集任务
- 创建任务即自动调度 Playwright 无头 Chromium 抓取抖音搜索结果，提取标题、文案、作者、互动数据
- 内置反自动化检测伪装（UA 等），默认只保留近 15 天的「爆款」，保证素材时效性
- 任务状态机：`pending → running → completed / failed`，全程记录任务日志，支持错误重试

### 🤖 AI 文案拆解（六维爆款分析）
LLM 对每条爆款视频的文案输出结构化 JSON 报告：

| 维度 | 内容 |
| --- | --- |
| 🎣 钩子设计 | 开头如何在前 3 秒锁定人群 |
| 🧱 文案结构 | 起承转合的叙事骨架 |
| ❤️ 情绪引导 | 激发了哪类情绪、为什么能引发转发 |
| 📣 行动号召 | 评论区 / 收藏 / 关注的引导话术 |
| 💡 关键洞察 | 可复用的爆款规律 |
| 🚀 优化建议 | 迁移到自己账号的具体做法 |

并给出 0–10 的综合评分，可按分数快速筛出值得模仿的样本。

### 📊 数据库与导出
- 采集结果统一入库，支持关键词搜索、按分类 / 任务筛选、按点赞数排序
- 一键导出 Excel / CSV，导出历史留痕，方便团队共享

## 🏗 系统架构

```
行业分类 / 关键词配置
        │
        ▼
采集任务（状态机 + 日志）
        │
        ▼
Playwright 无头浏览器 ──► 抖音搜索结果（标题 / 文案 / 互动数据 / 15天过滤）
        │
        ▼
MySQL（drizzle-orm 管理的数据仓库）
        │
        ▼
LLM 文案拆解（六维结构化报告 + 评分）
        │
        ▼
React Dashboard ──► 检索 / 分析 / Excel·CSV 导出
```

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui + TanStack Query |
| 后端 | Express 4 + tRPC 11 + Zod（端到端类型安全） |
| 数据库 | MySQL + drizzle-orm（8 张业务表：用户 / 分类 / 关键词 / 任务 / 视频 / 分析 / 导出 / 日志） |
| 采集 | Playwright（Chromium 无头模式） |
| AI | OpenAI 兼容协议接入 LLM（Gemini 2.5 Flash），JSON Schema 结构化输出 |

## 🚀 快速开始

```bash
# 1. 安装依赖（需要 Node.js 18+ 与 MySQL 8）
pnpm install

# 2. 准备环境变量
cat > .env << 'EOF'
DATABASE_URL=mysql://user:password@localhost:3306/douyin_analyzer
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=your-oauth-server
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-open-id
BUILT_IN_FORGE_API_URL=https://your-llm-endpoint/v1
BUILT_IN_FORGE_API_KEY=your-llm-api-key
EOF

# 3. 创建数据库表
pnpm db:push

# 4. 安装采集浏览器内核（首次）
npx playwright install chromium

# 5. 启动开发服务器
pnpm dev
```

生产部署：`pnpm build && pnpm start`，默认监听 3000 端口（冲突时自动顺延）。

> 📌 **说明**：认证与 LLM 接入遵循 OpenAI 兼容协议，脱离特定托管平台使用时，需自备 OAuth 服务与 LLM 端点；采集器可单独验证：`node scripts/test-collector.mjs`。

## 🗺 Roadmap

- [ ] 采集历史与任务日志页面
- [ ] 导出文件上传至对象存储，支持团队下载
- [ ] 爆款趋势看板（按行业 / 时间维度聚合）
- [ ] 多平台扩展（小红书、快手）

---

<div align="center">

**抖音爆款视频采集与分析平台** · Built with React, tRPC & Playwright

</div>
