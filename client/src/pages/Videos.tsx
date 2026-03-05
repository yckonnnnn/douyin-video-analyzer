import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Loader2,
  ThumbsUp,
  MessageCircle,
  Share2,
  Eye,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type SortBy = "likes" | "comments" | "shares" | "views" | "date";

export default function Videos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("likes");

  const categoriesQuery = trpc.categories.list.useQuery();
  const videosQuery = trpc.videos.listByCategory.useQuery(
    { categoryId: selectedCategory ? parseInt(selectedCategory) : 0 },
    {
      enabled: !!selectedCategory,
    }
  );
  const searchQuery_trpc = trpc.videos.search.useQuery(
    { query: searchQuery },
    {
      enabled: searchQuery.length > 0,
    }
  );

  const videos = searchQuery.length > 0 ? searchQuery_trpc.data || [] : videosQuery.data || [];

  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case "likes":
        return (b.likes || 0) - (a.likes || 0);
      case "comments":
        return (b.comments || 0) - (a.comments || 0);
      case "shares":
        return (b.shares || 0) - (a.shares || 0);
      case "views":
        return (b.views || 0) - (a.views || 0);
      case "date":
        return (
          new Date(b.publishedAt || "").getTime() -
          new Date(a.publishedAt || "").getTime()
        );
      default:
        return 0;
    }
  });

  const analyzeMutation = trpc.analysis.analyze.useMutation();

  const handleAnalyze = async (videoId: number) => {
    try {
      await analyzeMutation.mutateAsync({ videoId });
      toast.success("分析已提交，请稍伯");
    } catch (error) {
      toast.error("分析失败，请重试");
    }
  };

  return (
    <DashboardLayout title="视频数据">
      <div className="space-y-6">
        {/* Filters */}
        <div className="card-elegant">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="搜索视频标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
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

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger>
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="likes">按点赞数</SelectItem>
                <SelectItem value="comments">按评论数</SelectItem>
                <SelectItem value="shares">按分享数</SelectItem>
                <SelectItem value="views">按浏览数</SelectItem>
                <SelectItem value="date">按发布时间</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Videos List */}
        {videosQuery.isLoading || searchQuery_trpc.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : sortedVideos.length > 0 ? (
          <div className="space-y-4">
            {sortedVideos.map((video) => (
              <div key={video.id} className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50 group">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {video.coverImage && (
                    <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={video.coverImage}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          作者：{video.authorName || "未知"}
                        </p>
                      </div>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>

                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {video.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{video.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span>{video.comments || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Share2 className="w-4 h-4" />
                        <span>{video.shares || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>{video.views || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAnalyze(video.id)}
                        disabled={analyzeMutation.isPending}
                      >
                        {analyzeMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            分析中...
                          </>
                        ) : (
                          "AI 分析文案"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              暂无视频数据
            </h3>
            <p className="text-muted-foreground">
              {selectedCategory
                ? "该分类下暂无视频数据，请创建采集任务"
                : "请先选择行业分类或搜索视频"}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
