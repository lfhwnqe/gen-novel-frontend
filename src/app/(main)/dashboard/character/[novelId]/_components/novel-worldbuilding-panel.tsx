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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isGenerateDrawerOpen, setIsGenerateDrawerOpen] = React.useState(false);
  const [generatePrompt, setGeneratePrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    setDraftContent(draft?.content ?? "");
  }, [draft?.content]);

  const handleRefresh = React.useCallback(() => {
    void mutate();
  }, [mutate]);

  const handleDrawerOpenChange = React.useCallback((open: boolean) => {
    setIsGenerateDrawerOpen(open);
    if (!open) {
      setGeneratePrompt("");
    }
  }, []);

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

  const handlePublishDraft = React.useCallback(async () => {
    if (!draft?.worldbuildingId) {
      toast.error("暂无草稿可发布");
      return;
    }

    try {
      setIsPublishing(true);
      const res = await fetchWithAuth(`/api/v1/novels/worldbuildings/drafts/${draft.worldbuildingId}/publish`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.message?.message || `发布草稿失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }

      toast.success("草稿已发布为正式版");
      await mutate();
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "发布草稿失败";
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  }, [draft?.worldbuildingId, mutate]);

  const handleGenerateSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!novelId) {
        toast.error("缺少小说 ID，无法生成世界观");
        return;
      }

      if (!generatePrompt.trim()) {
        toast.error("请输入生成提示词");
        return;
      }

      try {
        setIsGenerating(true);
        const res = await fetchWithAuth("/api/v1/novels/generation/worldbuilding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: generatePrompt, novelId }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message =
            errorData?.message?.message || errorData?.message || `触发世界观生成失败: ${res.status} ${res.statusText}`;
          throw new Error(typeof message === "string" ? message : "触发世界观生成失败");
        }

        toast.success("已提交生成请求");
        setIsGenerateDrawerOpen(false);
        setGeneratePrompt("");
        await mutate();
      } catch (generateError) {
        const message = generateError instanceof Error ? generateError.message : "触发世界观生成失败";
        toast.error(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePrompt, mutate, novelId],
  );

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
        <div className="flex flex-wrap items-center gap-2">
          <Drawer direction="right" open={isGenerateDrawerOpen} onOpenChange={handleDrawerOpenChange}>
            <DrawerTrigger asChild>
              <Button size="sm">生成世界观</Button>
            </DrawerTrigger>
            <DrawerContent className="sm:max-w-xl">
              <DrawerHeader>
                <DrawerTitle>生成小说世界观</DrawerTitle>
                <DrawerDescription>输入提示词，生成新的世界观草稿内容。</DrawerDescription>
              </DrawerHeader>
              <form className="flex h-full flex-1 flex-col" onSubmit={handleGenerateSubmit}>
                <div className="flex flex-1 flex-col gap-4 px-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="worldbuilding-generate-prompt">生成提示词</Label>
                    <Textarea
                      id="worldbuilding-generate-prompt"
                      value={generatePrompt}
                      onChange={(event) => setGeneratePrompt(event.target.value)}
                      placeholder="例如：描绘一个拥有多颗卫星的奇幻世界，其科技水平介于蒸汽朋克与魔法之间。"
                      className="min-h-[160px]"
                      disabled={isGenerating}
                    />
                    <p className="text-muted-foreground text-xs">
                      提供越具体的背景、人物、冲突信息，生成结果越贴合创作需求。
                    </p>
                  </div>
                </div>
                <DrawerFooter>
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? "提交中..." : "提交生成"}
                  </Button>
                  <DrawerClose asChild>
                    <Button type="button" variant="outline" disabled={isGenerating}>
                      取消
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isValidating}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
        </div>
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
                  <Button variant="outline" onClick={handlePublishDraft} disabled={isPublishing || isSaving}>
                    {isPublishing ? "发布中..." : "保存为正式版"}
                  </Button>
                  <Button onClick={handleSaveDraft} disabled={isSaving || isPublishing}>
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
