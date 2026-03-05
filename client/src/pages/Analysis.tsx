import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Lightbulb,
  Zap,
  Target,
  BookOpen,
  Star,
} from "lucide-react";
import { Streamdown } from "streamdown";

export default function Analysis() {
  const analysisQuery = trpc.analysis.listByUser.useQuery();

  return (
    <DashboardLayout title="分析结果">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">文案分析结果</h2>
          <p className="text-muted-foreground mt-1">
            查看 AI 对采集视频文案的深度分析和洞察建议
          </p>
        </div>

        {/* Analysis List */}
        {analysisQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : analysisQuery.data && analysisQuery.data.length > 0 ? (
          <div className="space-y-6">
            {analysisQuery.data.map((analysis) => (
              <div key={analysis.id} className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/50">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        分析报告 #{analysis.videoId}
                      </h3>
                      {analysis.overallScore && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-semibold text-accent">
                            {parseFloat(analysis.overallScore).toFixed(1)}/10
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      分析时间：{new Date(analysis.analyzedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>

                {/* Analysis Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Hook */}
                  {analysis.hook && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-foreground">钩子设计</h4>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {analysis.hook}
                      </p>
                    </div>
                  )}

                  {/* Structure */}
                  {analysis.structure && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-foreground">文案结构</h4>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {analysis.structure}
                      </p>
                    </div>
                  )}

                  {/* Emotional Guidance */}
                  {analysis.emotionalGuidance && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-foreground">情绪引导</h4>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {analysis.emotionalGuidance}
                      </p>
                    </div>
                  )}

                  {/* Call to Action */}
                  {analysis.callToAction && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-accent" />
                        <h4 className="font-semibold text-foreground">行动号召</h4>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {analysis.callToAction}
                      </p>
                    </div>
                  )}
                </div>

                {/* Key Insights */}
                {analysis.keyInsights && analysis.keyInsights.length > 0 && (
                  <div className="mb-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      关键洞察
                    </h4>
                    <ul className="space-y-2">
                      {analysis.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-foreground">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      优化建议
                    </h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-foreground">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600/20 text-green-600 flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              暂无分析结果
            </h3>
            <p className="text-muted-foreground">
              在视频数据页面选择视频进行 AI 文案分析
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
