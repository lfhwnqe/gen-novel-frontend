"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { Character, WorkDetailResponse, WorkStatus } from "@/types/work";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 后端统一响应包装
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  message?: unknown;
}

// SWR fetcher for work detail
const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取作品详情失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  const json = await res.json();
  return (
    json && typeof json === "object" && "success" in json && json.success ? json.data : json
  ) as WorkDetailResponse;
};

export default function NovelDetailPage() {
  const params = useParams();
  const novelId = params?.novelId as string;

  const {
    data: detail,
    error,
    isLoading,
  } = useSWR<WorkDetailResponse>(novelId ? `/api/v1/novels/works/${novelId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  const work = detail?.work;
  const outlines = detail?.outlines ?? [];
  const characters = detail?.characters ?? [];

  const getStatusLabel = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.DRAFT:
        return "草稿";
      case WorkStatus.PUBLISHED:
        return "已发布";
      case WorkStatus.ARCHIVED:
        return "已归档";
      default:
        return status;
    }
  };

  const getStatusVariant = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.DRAFT:
        return "secondary";
      case WorkStatus.PUBLISHED:
        return "default";
      case WorkStatus.ARCHIVED:
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDateTime = (value: string) => new Date(value).toLocaleString("zh-CN");

  const formatTraits = (traits?: Character["traits"]) => {
    if (!traits) {
      return "";
    }
    if (Array.isArray(traits)) {
      return traits.join("，");
    }
    return traits;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>加载作品详情失败: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/novel">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>作品详情</CardTitle>
          <CardDescription>查看作品基本信息、剧情提纲与角色设定。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-4 w-32" />
                ))}
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : work ? (
            <Tabs defaultValue="introduction" className="flex flex-col gap-6">
              <TabsList className="flex w-full flex-wrap justify-start gap-2">
                <TabsTrigger value="introduction">小说介绍</TabsTrigger>
                <TabsTrigger value="worldview">小说世界观</TabsTrigger>
                <TabsTrigger value="outline">小说大纲</TabsTrigger>
                <TabsTrigger value="characters">小说人物</TabsTrigger>
              </TabsList>
              <TabsContent value="introduction" className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">标题</Label>
                    <div className="mt-1 text-lg font-semibold">{work.title}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">状态</Label>
                    <Badge variant={getStatusVariant(work.status)} className="mt-1">
                      {getStatusLabel(work.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      作品 ID
                    </Label>
                    <div className="text-muted-foreground mt-1 font-mono text-sm">{work.novelId}</div>
                  </div>
                  {work.createdBy && (
                    <div>
                      <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        创建人
                      </Label>
                      <div className="mt-1 text-sm">{work.createdBy}</div>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      创建时间
                    </Label>
                    <div className="mt-1 text-sm">{formatDateTime(work.createdAt)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      更新时间
                    </Label>
                    <div className="mt-1 text-sm">{formatDateTime(work.updatedAt)}</div>
                  </div>
                  {work.description && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">描述</Label>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{work.description}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">剧情提纲</Label>
                  {outlines.length ? (
                    <div className="space-y-4">
                      {outlines.map((outline, index) => (
                        <div key={outline.outlineId} className="rounded-lg border p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold">{outline.title?.trim() || `提纲 ${index + 1}`}</h3>
                              {outline.summary && (
                                <p className="text-muted-foreground mt-1 text-sm">{outline.summary}</p>
                              )}
                            </div>
                            <div className="text-muted-foreground font-mono text-xs">ID: {outline.outlineId}</div>
                          </div>
                          {outline.content && (
                            <pre className="bg-muted/50 mt-3 max-h-60 overflow-auto rounded-md border p-3 text-xs whitespace-pre-wrap">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(outline.content), null, 2);
                                } catch {
                                  return outline.content;
                                }
                              })()}
                            </pre>
                          )}
                          <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
                            <span>创建时间：{formatDateTime(outline.createdAt)}</span>
                            <span>更新时间：{formatDateTime(outline.updatedAt)}</span>
                            {outline.createdBy && <span>创建人：{outline.createdBy}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">暂无提纲数据</div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">角色设定</Label>
                  {characters.length ? (
                    <div className="space-y-4">
                      {characters.map((character) => {
                        const traitsText = formatTraits(character.traits);
                        return (
                          <div key={character.characterId} className="rounded-lg border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold">{character.name}</h3>
                                {character.role && (
                                  <p className="text-muted-foreground mt-1 text-sm">角色定位：{character.role}</p>
                                )}
                              </div>
                              <div className="text-muted-foreground font-mono text-xs">ID: {character.characterId}</div>
                            </div>
                            {traitsText && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">性格特征：</span>
                                <span>{traitsText}</span>
                              </div>
                            )}
                            {character.background && (
                              <div className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                                {character.background}
                              </div>
                            )}
                            <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
                              <span>创建时间：{formatDateTime(character.createdAt)}</span>
                              <span>更新时间：{formatDateTime(character.updatedAt)}</span>
                              {character.createdBy && <span>创建人：{character.createdBy}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">暂无角色数据</div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="worldview">
                <div className="text-muted-foreground flex min-h-[200px] items-center justify-center">
                  小说世界观内容敬请期待
                </div>
              </TabsContent>
              <TabsContent value="outline">
                <div className="text-muted-foreground flex min-h-[200px] items-center justify-center">
                  小说大纲内容敬请期待
                </div>
              </TabsContent>
              <TabsContent value="characters">
                <div className="text-muted-foreground flex min-h-[200px] items-center justify-center">
                  小说人物内容敬请期待
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>未找到作品数据。</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
