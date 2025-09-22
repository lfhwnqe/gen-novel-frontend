"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { AlertCircle, RefreshCcw } from "lucide-react";

import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { OutlineLatestVersions, OutlineStatus } from "@/types/outline";
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

interface NovelOutlinePanelProps {
  novelId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取小说大纲失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  const json = (await res.json()) as ApiResponse<OutlineLatestVersions>;
  return json?.success ? json.data : (json as unknown as OutlineLatestVersions);
};

const statusLabelMap: Record<OutlineStatus, string> = {
  [OutlineStatus.DRAFT]: "草稿",
  [OutlineStatus.PUBLISHED]: "已发布",
};

const statusVariantMap: Record<OutlineStatus, "default" | "secondary"> = {
  [OutlineStatus.DRAFT]: "secondary",
  [OutlineStatus.PUBLISHED]: "default",
};

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "--");

const formatOutlineContent = (content?: string) => {
  if (!content) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
};

export function NovelOutlinePanel({ novelId }: NovelOutlinePanelProps) {
  const shouldFetch = novelId ? `/api/v1/novels/outlines/latest?novelId=${encodeURIComponent(novelId)}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<OutlineLatestVersions>(shouldFetch, fetcher, {
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
    if (!draft?.outlineId) {
      toast.error("暂无草稿可保存");
      return;
    }

    if (!draftContent.trim()) {
      toast.error("请填写草稿内容");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetchWithAuth(`/api/v1/novels/outlines/${draft.outlineId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: draftContent,
          novelId: draft.novelId ?? novelId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.message?.message || `保存大纲失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }

      toast.success("大纲草稿已保存");
      await mutate();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "保存大纲失败";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [draft?.outlineId, draft?.novelId, draftContent, mutate, novelId]);

  const handlePublishDraft = React.useCallback(async () => {
    if (!draft?.outlineId) {
      toast.error("暂无草稿可发布");
      return;
    }

    try {
      setIsPublishing(true);
      const res = await fetchWithAuth(`/api/v1/novels/outlines/drafts/${draft.outlineId}/publish`, {
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
  }, [draft?.outlineId, mutate]);

  const handleGenerateSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!novelId) {
        toast.error("缺少小说 ID，无法生成大纲");
        return;
      }

      if (!generatePrompt.trim()) {
        toast.error("请输入生成提示词");
        return;
      }

      try {
        setIsGenerating(true);
        const res = await fetchWithAuth("/api/v1/novels/generation/scenario-outline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: generatePrompt, novelId }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message =
            errorData?.message?.message || errorData?.message || `触发大纲生成失败: ${res.status} ${res.statusText}`;
          throw new Error(typeof message === "string" ? message : "触发大纲生成失败");
        }

        toast.success("已提交生成请求");
        setIsGenerateDrawerOpen(false);
        setGeneratePrompt("");
        await mutate();
      } catch (generateError) {
        const message = generateError instanceof Error ? generateError.message : "触发大纲生成失败";
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
        <AlertDescription>缺少小说 ID，无法加载大纲信息。</AlertDescription>
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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">小说大纲版本</h3>
          <p className="text-muted-foreground text-sm">查看最新发布版本与草稿版本，可在线编辑草稿内容并触发生成。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Drawer direction="right" open={isGenerateDrawerOpen} onOpenChange={handleDrawerOpenChange}>
            <DrawerTrigger asChild>
              <Button size="sm">生成大纲</Button>
            </DrawerTrigger>
            <DrawerContent className="sm:max-w-xl">
              <DrawerHeader>
                <DrawerTitle>生成小说大纲</DrawerTitle>
                <DrawerDescription>输入提示词，生成新的大纲草稿内容。</DrawerDescription>
              </DrawerHeader>
              <form className="flex h-full flex-1 flex-col" onSubmit={handleGenerateSubmit}>
                <div className="flex flex-1 flex-col gap-4 px-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outline-generate-prompt">生成提示词</Label>
                    <Textarea
                      id="outline-generate-prompt"
                      value={generatePrompt}
                      onChange={(event) => setGeneratePrompt(event.target.value)}
                      placeholder="例如：写一部赛博朋克风格的成长故事，主角是一名黑客少年。"
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
            <CardDescription>展示最近一次发布的大纲内容。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {published ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariantMap[published.status]}>{statusLabelMap[published.status]}</Badge>
                  <span className="text-muted-foreground text-xs">ID: {published.outlineId}</span>
                </div>
                {published.content && (
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      正文内容
                    </Label>
                    <pre className="bg-muted/50 mt-2 max-h-80 overflow-auto rounded-md border p-4 text-sm whitespace-pre-wrap">
                      {formatOutlineContent(published.content)}
                    </pre>
                  </div>
                )}
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
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="outline-draft-content">草稿正文</Label>
                  <Textarea
                    id="outline-draft-content"
                    value={draftContent}
                    onChange={(event) => setDraftContent(event.target.value)}
                    placeholder="请输入小说大纲草稿内容，可以使用 Markdown 或 JSON 结构"
                    className="min-h-[240px]"
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
