import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function TaskLogs() {
  const [, setLocation] = useLocation();
  const [taskId, setTaskId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 从 URL 获取 taskId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("taskId");
    if (id) {
      setTaskId(parseInt(id));
    }
  }, []);

  // 查询任务信息
  const taskQuery = trpc.tasks.getById.useQuery(
    { id: taskId || 0 },
    { enabled: !!taskId }
  );

  // 查询任务日志
  const logsQuery = trpc.tasks.getLogs.useQuery(
    { taskId: taskId || 0 },
    { 
      enabled: !!taskId,
      refetchInterval: autoRefresh ? 2000 : false, // 自动刷新间隔 2 秒
    }
  );

  if (!taskId) {
    return (
      <DashboardLayout title="采集日志">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">未指定采集任务</p>
        </div>
      </DashboardLayout>
    );
  }

  const task = taskQuery.data;
  const logs = logsQuery.data || [];

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            运行中
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            已完成
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            失败
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
            已暂停
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
            待处理
          </span>
        );
    }
  };

  return (
    <DashboardLayout title="采集日志">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/tasks")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回任务列表
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">采集日志</h2>
              {task && (
                <p className="text-muted-foreground mt-1">
                  任务: {task.name}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => logsQuery.refetch()}
            disabled={logsQuery.isRefetching}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${logsQuery.isRefetching ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
        </div>

        {/* Task Info Card */}
        {task && (
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">任务状态</p>
                <div>{getStatusBadge(task.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">采集进度</p>
                <p className="text-lg font-semibold text-foreground">
                  {task.collectedVideos || 0} / {task.totalVideos || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">创建时间</p>
                <p className="text-sm text-foreground">
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">耗时</p>
                <p className="text-sm text-foreground">
                  {task.startedAt && task.completedAt
                    ? `${Math.round(
                        (new Date(task.completedAt).getTime() -
                          new Date(task.startedAt).getTime()) /
                          1000
                      )}s`
                    : task.startedAt
                      ? "进行中..."
                      : "-"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-foreground">自动刷新日志</span>
          </label>
          {autoRefresh && (
            <span className="text-xs text-muted-foreground">
              (每 2 秒刷新一次)
            </span>
          )}
        </div>

        {/* Logs Container */}
        <Card className="p-6">
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">加载日志中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">暂无日志</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getLogColor(
                    log.level || "info"
                  )} flex gap-3`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.level || "info")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground break-words">
                        {log.message}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                    {log.metadata && typeof log.metadata === "object" && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <details className="cursor-pointer">
                          <summary className="hover:text-foreground">
                            详细信息
                          </summary>
                          <pre className="mt-1 p-2 bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                            {JSON.stringify(log.metadata, null, 2) || ""}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Error Summary */}
        {logs.some((log) => log.level === "error") && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">检测到错误</h3>
                <p className="text-sm text-red-800 mt-1">
                  采集过程中发生了
                  {logs.filter((log) => log.level === "error").length}
                  个错误。请查看上方日志了解详情。
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
