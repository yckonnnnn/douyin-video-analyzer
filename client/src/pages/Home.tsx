import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  Database,
  Zap,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const tasksQuery = trpc.tasks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const categoriesQuery = trpc.categories.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const videosQuery = trpc.videos.listByCategory.useQuery(
    { categoryId: categoriesQuery.data?.[0]?.id || 0 },
    {
      enabled: isAuthenticated && (categoriesQuery.data?.length || 0) > 0,
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                抖音爆款视频采集与分析
              </h1>
              <p className="text-muted-foreground">
                使用 AI 驱动的工具，采集和分析抖音热门视频，获取深度文案洞察
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full"
          >
            登录开始使用
          </Button>
        </div>
      </div>
    );
  }

  const totalTasks = tasksQuery.data?.length || 0;
  const totalCategories = categoriesQuery.data?.length || 0;
  const totalVideos = videosQuery.data?.length || 0;

  const stats = [
    {
      label: "采集任务",
      value: totalTasks,
      icon: <Zap className="w-6 h-6" />,
      color: "bg-blue-500/10 text-blue-600",
      href: "/tasks",
    },
    {
      label: "行业分类",
      value: totalCategories,
      icon: <Database className="w-6 h-6" />,
      color: "bg-purple-500/10 text-purple-600",
      href: "/categories",
    },
    {
      label: "采集视频",
      value: totalVideos,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-green-500/10 text-green-600",
      href: "/videos",
    },
  ];

  return (
    <DashboardLayout title="仪表板">
      <div className="space-y-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Link key={stat.href} href={stat.href}>
              <a className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-accent group-hover:gap-3 transition-all">
                  <span className="text-sm font-medium">查看详情</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">快速操作</h2>
            <p className="text-sm text-muted-foreground mt-1">
              开始新的采集任务或管理现有配置
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/categories">
              <a className="group p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-muted transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      管理行业分类
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      创建和编辑行业分类，配置搜索关键词
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </a>
            </Link>

            <Link href="/tasks">
              <a className="group p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-muted transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      创建采集任务
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      启动新的视频采集任务，自动化获取热门数据
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </a>
            </Link>

            <Link href="/videos">
              <a className="group p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-muted transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      浏览视频数据
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      查看采集的视频数据，支持排序和筛选
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </a>
            </Link>

            <Link href="/analysis">
              <a className="group p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-muted transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      查看分析结果
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      获取 AI 驱动的文案分析和洞察建议
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </a>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        {tasksQuery.data && tasksQuery.data.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                最近的采集任务
              </h2>
            </div>

            <div className="space-y-3">
              {tasksQuery.data.slice(0, 5).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <a className="group flex items-center justify-between p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-muted transition-all cursor-pointer">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {task.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.collectedVideos || 0} / {task.totalVideos || 0} 视频已采集
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          task.status === "running"
                            ? "bg-blue-500/10 text-blue-600"
                            : task.status === "completed"
                              ? "bg-green-500/10 text-green-600"
                              : task.status === "failed"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {task.status === "running"
                          ? "运行中"
                          : task.status === "completed"
                            ? "已完成"
                            : task.status === "failed"
                              ? "失败"
                              : "待处理"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
