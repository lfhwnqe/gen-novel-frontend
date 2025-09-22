"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { Character } from "@/types/work";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  message?: unknown;
}

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取角色详情失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  const json = await res.json();
  const payload = (
    json && typeof json === "object" && "success" in json ? (json as ApiResponse<Character>).data : json
  ) as Character;
  return payload;
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
}

function renderTraits(traits?: string[] | string) {
  if (!traits) return <span className="text-muted-foreground text-sm">无</span>;
  const list = Array.isArray(traits)
    ? traits
    : String(traits)
        .split(/\n|,|、/)
        .map((item) => item.trim())
        .filter(Boolean);
  if (!list.length) return <span className="text-muted-foreground text-sm">无</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  );
}

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params?.characterId as string | undefined;

  const {
    data: character,
    error,
    isLoading,
  } = useSWR<Character>(characterId ? `/api/v1/novels/characters/${characterId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>加载角色详情失败: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/character">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回角色列表
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>角色详情</CardTitle>
          <CardDescription>查看角色基础信息、性格特质与背景设定。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || !character ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-4 w-40" />
                ))}
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">角色名称</Label>
                  <div className="mt-1 text-lg font-semibold">{character.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">角色定位</Label>
                  <div className="text-muted-foreground mt-1 text-sm">{character.role || "未设置"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">角色 ID</Label>
                  <div className="text-muted-foreground mt-1 font-mono text-sm">{character.characterId}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    所属小说 ID
                  </Label>
                  {character.novelId ? (
                    <Link
                      href={`/dashboard/novel/${character.novelId}`}
                      className="text-primary mt-1 inline-flex items-center text-sm hover:underline"
                    >
                      {character.novelId}
                    </Link>
                  ) : (
                    <div className="text-muted-foreground mt-1 text-sm">未关联</div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">创建时间</Label>
                  <div className="text-muted-foreground mt-1 text-sm">{formatDateTime(character.createdAt)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">更新时间</Label>
                  <div className="text-muted-foreground mt-1 text-sm">{formatDateTime(character.updatedAt)}</div>
                </div>
                {character.createdBy && (
                  <div>
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">创建人</Label>
                    <div className="text-muted-foreground mt-1 text-sm">{character.createdBy}</div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">性格特质</Label>
                <div className="mt-2">{renderTraits(character.traits)}</div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">角色背景</Label>
                <div className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                  {character.background?.trim() ? character.background : "暂无背景描述"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
