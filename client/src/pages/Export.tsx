import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Download,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type ExportFormat = "excel" | "csv";

export default function Export() {
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");

  const tasksQuery = trpc.tasks.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const exportHistoryQuery = trpc.export.history.useQuery();
  const exportMutation = trpc.export.export.useMutation();

  const handleExport = async () => {
    if (!selectedTask && !selectedCategory) {
      toast.error("请选择采集任务或行业分类");
      return;
    }

    try {
      const result = await exportMutation.mutateAsync({
        taskId: selectedTask ? parseInt(selectedTask) : undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        format: exportFormat,
      });

      toast.success(`数据已导出为 ${exportFormat.toUpperCase()}`);
      setSelectedTask("");
      setSelectedCategory("");
    } catch (error) {
      toast.error("导出失败，请重试");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "failed":
        return "失败";
      default:
        return "处理中";
    }
  };

  return (
    <DashboardLayout title="数据导出">
      <div className="space-y-6">
        {/* Export Form */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">导出数据</h2>
            <p className="text-sm text-muted-foreground mt-1">
              将采集的视频数据导出为 Excel 或 CSV 格式
            </p>
          </div>

          <div className="space-y-4">
            {/* Task Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                选择采集任务（可选）
              </label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="选择采集任务" />
                </SelectTrigger>
                <SelectContent>
                  {tasksQuery.data?.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.name} ({task.collectedVideos || 0} 个视频)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                或选择行业分类（可选）
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择行业分类" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                导出格式
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExportFormat("excel")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportFormat === "excel"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="font-medium text-foreground">Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx 格式</p>
                </button>

                <button
                  onClick={() => setExportFormat("csv")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportFormat === "csv"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <p className="font-medium text-foreground">CSV</p>
                  <p className="text-xs text-muted-foreground">.csv 格式</p>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending || (!selectedTask && !selectedCategory)}
              className="w-full gap-2"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  导出数据
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Export History */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">导出历史</h2>
            <p className="text-sm text-muted-foreground mt-1">
              查看之前的导出记录
            </p>
          </div>

          {exportHistoryQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : exportHistoryQuery.data && exportHistoryQuery.data.length > 0 ? (
            <div className="space-y-3">
              {exportHistoryQuery.data.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getStatusIcon(record.status)}
                      <h3 className="font-medium text-foreground">
                        {record.fileName}
                      </h3>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {record.format.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {record.recordCount} 条记录 •{" "}
                      {new Date(record.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>

                  {record.status === "completed" && record.fileUrl && (
                    <a href={record.fileUrl} download>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </a>
                  )}

                  {record.status === "failed" && (
                    <div className="text-sm text-destructive">
                      {record.errorMessage || "导出失败"}
                    </div>
                  )}

                  {record.status === "pending" && (
                    <span className="text-sm text-muted-foreground">
                      {getStatusLabel(record.status)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">暂无导出历史</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
