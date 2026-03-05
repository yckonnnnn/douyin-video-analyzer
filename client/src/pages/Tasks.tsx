import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Play,
  Pause,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Tasks() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    maxResults: 50,
    daysFilter: 15,
  });

  const tasksQuery = trpc.tasks.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const createMutation = trpc.tasks.create.useMutation();
  const updateStatusMutation = trpc.tasks.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error("请选择行业分类");
      return;
    }

    try {
      await createMutation.mutateAsync({
        categoryId: parseInt(formData.categoryId),
        name: formData.name,
        description: formData.description,
        config: {
          keywords: [],
          maxResults: formData.maxResults,
          daysFilter: formData.daysFilter,
        },
      });

      toast.success("采集任务已创建");
      await utils.tasks.list.invalidate();
      setFormData({
        categoryId: "",
        name: "",
        description: "",
        maxResults: 50,
        daysFilter: 15,
      });
      setOpen(false);
    } catch (error) {
      toast.error("创建失败，请重试");
    }
  };

  const handleStatusChange = async (
    taskId: number,
    newStatus: "running" | "paused" | "completed"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: taskId,
        status: newStatus,
      });
      await utils.tasks.list.invalidate();
      toast.success("任务状态已更新");
    } catch (error) {
      toast.error("更新失败，请重试");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "运行中";
      case "completed":
        return "已完成";
      case "failed":
        return "失败";
      case "paused":
        return "已暂停";
      default:
        return "待处理";
    }
  };

  return (
    <DashboardLayout title="采集任务管理">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">采集任务</h2>
            <p className="text-muted-foreground mt-1">
              创建和管理视频采集任务，监控采集进度
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新建任务
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建采集任务</DialogTitle>
                <DialogDescription>
                  为特定行业分类创建一个新的视频采集任务
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">行业分类</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
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

                <div>
                  <Label htmlFor="name">任务名称</Label>
                  <Input
                    id="name"
                    placeholder="例如：2024年3月广告视频采集"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    placeholder="任务的详细描述（可选）"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxResults">最大采集数</Label>
                    <Input
                      id="maxResults"
                      type="number"
                      min="1"
                      max="500"
                      value={formData.maxResults}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxResults: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="daysFilter">时间范围（天）</Label>
                    <Input
                      id="daysFilter"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.daysFilter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          daysFilter: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      "创建任务"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        {tasksQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : tasksQuery.data && tasksQuery.data.length > 0 ? (
          <div className="space-y-4">
            {tasksQuery.data.map((task) => (
              <div key={task.id} className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="text-lg font-semibold text-foreground">
                        {task.name}
                      </h3>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {task.status === "pending" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusChange(task.id, "running")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        启动
                      </Button>
                    )}
                    {task.status === "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(task.id, "paused")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        暂停
                      </Button>
                    )}
                    <Link href={`/tasks/${task.id}`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">采集进度</span>
                    <span className="font-medium text-foreground">
                      {task.collectedVideos || 0} / {task.totalVideos || 0}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{
                        width: `${
                          (task.totalVideos || 0) > 0
                            ? ((task.collectedVideos || 0) / (task.totalVideos || 0)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Task Info */}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">创建时间</p>
                    <p className="font-medium text-foreground">
                      {new Date(task.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">最大采集数</p>
                    <p className="font-medium text-foreground">
                      {task.config?.maxResults || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">时间范围</p>
                    <p className="font-medium text-foreground">
                      {task.config?.daysFilter || "-"}天内
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              暂无采集任务
            </h3>
            <p className="text-muted-foreground mb-6">
              创建第一个采集任务开始采集视频数据
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  创建任务
                </Button>
              </DialogTrigger>
            </Dialog>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
