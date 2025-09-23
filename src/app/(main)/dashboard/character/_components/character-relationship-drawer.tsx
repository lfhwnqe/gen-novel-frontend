"use client";

import * as React from "react";
import useSWR from "swr";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CharacterRelationshipHistoryEvent } from "@/types/work";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";

interface RelationshipHistoryListResponse {
  data: CharacterRelationshipHistoryEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CharacterRelationshipDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCharacterId: string;
  currentCharacterName: string;
  relatedCharacterId: string;
  relatedCharacterName?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const normalizeResponse = (
  payload: unknown,
  fallback: { page: number; limit: number },
): RelationshipHistoryListResponse => {
  const base: RelationshipHistoryListResponse = {
    data: [],
    total: 0,
    page: fallback.page,
    limit: fallback.limit,
    totalPages: 0,
  };

  const parse = (value: unknown): RelationshipHistoryListResponse | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const rawData = Array.isArray(record.data) ? (record.data as CharacterRelationshipHistoryEvent[]) : [];
    const total = typeof record.total === "number" ? record.total : rawData.length;
    const page = typeof record.page === "number" ? record.page : fallback.page;
    const limit = typeof record.limit === "number" ? record.limit : fallback.limit;
    const totalPages = typeof record.totalPages === "number" ? record.totalPages : limit ? Math.ceil(total / limit) : 0;
    return {
      data: rawData,
      total,
      page,
      limit,
      totalPages,
    };
  };

  if (!payload || typeof payload !== "object") return base;
  const record = payload as Record<string, unknown>;

  if ("success" in record && "data" in record) {
    const parsed = parse(record.data);
    if (parsed) return parsed;
  }

  const direct = parse(payload);
  if (direct) return direct;

  if ("data" in record && Array.isArray(record.data)) {
    return {
      ...base,
      data: record.data as CharacterRelationshipHistoryEvent[],
      total: (record.data as unknown[]).length,
      totalPages: fallback.limit ? Math.ceil(((record.data as unknown[]).length || 0) / fallback.limit) : 0,
    };
  }

  return base;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
};

export function CharacterRelationshipDrawer({
  open,
  onOpenChange,
  currentCharacterId,
  currentCharacterName,
  relatedCharacterId,
  relatedCharacterName,
}: CharacterRelationshipDrawerProps) {
  const fetchWithAuth = useFetchWithAuth();
  const [page, setPage] = React.useState(DEFAULT_PAGE);
  const [limit, setLimit] = React.useState(DEFAULT_LIMIT);

  React.useEffect(() => {
    if (!open) {
      setPage(DEFAULT_PAGE);
      setLimit(DEFAULT_LIMIT);
    }
  }, [open]);

  React.useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [currentCharacterId, relatedCharacterId]);

  const queryKey = open
    ? ["character-relationship-current", currentCharacterId, relatedCharacterId, page, limit]
    : null;

  const fetcher = React.useCallback(
    async ([, characterAId, characterBId, pageParam, limitParam]: [string, string, string, number, number]) => {
      const res = await fetchWithAuth("/api/v1/novels/characters/relationships/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterAId,
          characterBId,
          page: pageParam,
          limit: limitParam,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const message =
          err?.message?.message || err?.message || `历史关系数据获取失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }
      const json = await res.json().catch(() => ({}));
      return normalizeResponse(json, { page: pageParam, limit: limitParam });
    },
    [fetchWithAuth],
  );

  const { data, isLoading, error, mutate } = useSWR(queryKey, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const relationships = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? page;
  const pageSize = data?.limit ?? limit;

  const handleRefresh = () => {
    if (queryKey) mutate();
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => (totalPages ? Math.min(totalPages, prev + 1) : prev + 1));
  };

  const handlePageSizeChange = (value: string) => {
    const nextLimit = Number(value) || DEFAULT_LIMIT;
    setLimit(nextLimit);
    setPage(DEFAULT_PAGE);
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>角色关系详情</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="text-muted-foreground text-sm">
            当前角色：{currentCharacterName}（ID：{currentCharacterId}）
            <br />
            关联角色：{relatedCharacterName || relatedCharacterId}（ID：{relatedCharacterId}）
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-muted-foreground text-xs">
              共 {total} 条记录，当前第 {currentPage} 页
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> 刷新
              </Button>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-24">
                  <SelectValue placeholder="每页数量" />
                </SelectTrigger>
                <SelectContent align="end">
                  {[5, 10, 20, 50].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      每页 {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && !relationships.length ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2 rounded-md border p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-destructive text-sm">{error.message}</div>
          ) : relationships.length ? (
            <div className="space-y-3">
              {relationships.map((item) => (
                <div key={item.eventId} className="space-y-3 rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.newRelType || item.prevRelType || "未标记"}</Badge>
                      <span className="text-muted-foreground text-xs">事件 ID：{item.eventId}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">发生时间：{formatDateTime(item.occurredAt)}</span>
                  </div>
                  <div className="text-muted-foreground grid gap-1 text-sm">
                    <span>配对键：{item.pairKey}</span>
                    <span>变更前关系：{item.prevRelType || "-"}</span>
                    <span>变更后关系：{item.newRelType || "-"}</span>
                    <span>关联章节：{item.chapterId || "-"}</span>
                    <span>关联场景：{item.sceneId || "-"}</span>
                    <span>记录小说：{item.novelId || "-"}</span>
                    <span>记录人：{item.createdBy || "-"}</span>
                    <span>记录时间：{formatDateTime(item.createdAt)}</span>
                  </div>
                  {item.reason?.trim() ? (
                    <div className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
                      <span className="text-foreground font-medium">变更原因：</span>
                      <br />
                      {item.reason}
                    </div>
                  ) : null}
                  {item.notes?.trim() ? (
                    <div className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
                      <span className="text-foreground font-medium">备注：</span>
                      <br />
                      {item.notes}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">暂无历史关系记录。</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
            <div className="text-muted-foreground text-xs">
              第 {currentPage} / {Math.max(totalPages, 1)} 页
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={isLoading || currentPage <= 1}>
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={isLoading || (totalPages ? currentPage >= totalPages : relationships.length < pageSize)}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
