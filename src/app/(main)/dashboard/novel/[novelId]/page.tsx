"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { Work, WorkStatus } from "@/types/work";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  return (json && typeof json === "object" && "success" in json && json.success ? json.data : json) as Work;
};

export default function NovelDetailPage() {
  const params = useParams();
  const novelId = params?.novelId as string;

  const {
    data: work,
    error,
    isLoading,
  } = useSWR<Work>(novelId ? `/api/v1/novels/works/${novelId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

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
          <CardDescription>查看作品的基本信息与状态。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-32" />
                ))}
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ) : work ? (
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
                <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">作品 ID</Label>
                <div className="text-muted-foreground mt-1 font-mono text-sm">{work.novelId}</div>
              </div>
              {work.createdBy && (
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">创建人</Label>
                  <div className="mt-1 text-sm">{work.createdBy}</div>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">创建时间</Label>
                <div className="mt-1 text-sm">{new Date(work.createdAt).toLocaleString("zh-CN")}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">更新时间</Label>
                <div className="mt-1 text-sm">{new Date(work.updatedAt).toLocaleString("zh-CN")}</div>
              </div>
              {work.description && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">描述</Label>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{work.description}</div>
                </div>
              )}
            </div>
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
