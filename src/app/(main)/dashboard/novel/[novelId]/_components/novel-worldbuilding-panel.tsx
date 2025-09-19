"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { AlertCircle, RefreshCcw } from "lucide-react";

import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { WorldbuildingLatestVersions, WorldbuildingStatus } from "@/types/worldbuilding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: unknown;
}

interface NovelWorldbuildingPanelProps {
  novelId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取小说世界观失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  const json = (await res.json()) as ApiResponse<WorldbuildingLatestVersions>;
  return json?.success ? json.data : (json as unknown as WorldbuildingLatestVersions);
};

const statusLabelMap: Record<WorldbuildingStatus, string> = {
  [WorldbuildingStatus.DRAFT]: "草稿",
  [WorldbuildingStatus.PUBLISHED]: "已发布",
};

const statusVariantMap: Record<WorldbuildingStatus, "default" | "secondary"> = {
  [WorldbuildingStatus.DRAFT]: "secondary",
  [WorldbuildingStatus.PUBLISHED]: "default",
};

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "--");

export function NovelWorldbuildingPanel({ novelId }: NovelWorldbuildingPanelProps) {
  const shouldFetch = novelId ? `/api/v1/novels/worldbuildings/latest?novelId=${encodeURIComponent(novelId)}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<WorldbuildingLatestVersions>(shouldFetch, fetcher, {
    revalidateOnFocus: false,
  });

  const draft = data?.draft;
  const published = data?.published;

  const [draftContent, setDraftContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setDraftContent(draft?.content ?? "");
  }, [draft?.content]);

  const handleRefresh = React.useCallback(() => {
    void mutate();
  }, [mutate]);

  const handleSaveDraft = React.useCallback(async () => {
    if (!draft?.worldbuildingId) {
      toast.error("暂无草稿可保存");
      return;
    }

    if (!draftContent.trim()) {
      toast.error("请填写草稿内容");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetchWithAuth(`/api/v1/novels/worldbuildings/drafts/${draft.worldbuildingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: draftContent }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.message?.message || `保存草稿失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }

      toast.success("草稿已保存");
      await mutate();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "保存草稿失败";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [draft?.worldbuildingId, draftContent, mutate]);

  if (!novelId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>缺少小说 ID，无法加载世界观信息。</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">小说世界观版本</h3>
          <p className="text-muted-foreground text-sm">查看最新发布版本与草稿版本，并可在线编辑草稿内容。</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isValidating}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>已发布版本</CardTitle>
            <CardDescription>展示最近一次对外发布的世界观内容。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {published ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariantMap[published.status]}>{statusLabelMap[published.status]}</Badge>
                  <span className="text-muted-foreground text-xs">ID: {published.worldbuildingId}</span>
                </div>
                {published.title && (
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">标题</Label>
                    <div className="mt-1 text-sm font-medium">{published.title}</div>
                  </div>
                )}
                {published.summary && (
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">摘要</Label>
                    <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{published.summary}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">正文内容</Label>
                  <div className="bg-muted/50 mt-2 max-h-80 overflow-auto rounded-md border p-4 text-sm whitespace-pre-wrap">
                    {published.content}
                  </div>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                  <span>创建时间：{formatDateTime(published.createdAt)}</span>
                  <span>更新时间：{formatDateTime(published.updatedAt)}</span>
                  {published.createdBy && <span>创建人：{published.createdBy}</span>}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">暂无发布版本。</p>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>草稿版本</CardTitle>
            <CardDescription>编辑草稿内容并保存，稍后可发布为正式版本。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {draft ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariantMap[draft.status]}>{statusLabelMap[draft.status]}</Badge>
                  <span className="text-muted-foreground text-xs">ID: {draft.worldbuildingId}</span>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">草稿内容</Label>
                  <Textarea
                    value={draftContent}
                    onChange={(event) => setDraftContent(event.target.value)}
                    placeholder="请输入小说世界观草稿内容"
                    className="mt-2 min-h-[240px]"
                  />
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                  <span>创建时间：{formatDateTime(draft.createdAt)}</span>
                  <span>更新时间：{formatDateTime(draft.updatedAt)}</span>
                  {draft.createdBy && <span>创建人：{draft.createdBy}</span>}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Button onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? "保存中..." : "保存草稿"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">暂无草稿版本。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
