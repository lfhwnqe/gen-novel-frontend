"use client";

import * as React from "react";
import useSWR from "swr";
import { RefreshCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";
import { Character, CharacterRelationshipEdge } from "@/types/work";

interface CharacterDetailDialogProps {
  open: boolean;
  loading: boolean;
  character: Character | null;
  error?: string | null;
  onClose: () => void;
}

const extractRelationships = (input: unknown): CharacterRelationshipEdge[] => {
  const normalize = (value: unknown): CharacterRelationshipEdge | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const characterId = typeof record.characterId === "string" ? record.characterId : undefined;
    const relationType = typeof record.relationType === "string" ? record.relationType : undefined;
    if (!characterId || !relationType) return null;
    const name = typeof record.name === "string" ? record.name : undefined;
    return { characterId, relationType, name };
  };

  const collect = (items: unknown[]): CharacterRelationshipEdge[] =>
    items.map((item) => normalize(item)).filter((item): item is CharacterRelationshipEdge => Boolean(item));

  if (!input || typeof input !== "object") return [];
  const record = input as Record<string, unknown>;
  if ("success" in record && "data" in record) {
    const data = record.data as Record<string, unknown> | undefined;
    if (data && Array.isArray((data as any).data)) {
      return collect((data as any).data as unknown[]);
    }
    if (Array.isArray(data)) {
      return collect(data as unknown[]);
    }
  }
  if ("data" in record && Array.isArray(record.data)) {
    return collect(record.data as unknown[]);
  }
  if (Array.isArray(input)) return collect(input as unknown[]);
  return [];
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
};

const renderTraits = (traits?: string[] | string) => {
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
        <span key={item} className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs">
          {item}
        </span>
      ))}
    </div>
  );
};

export function CharacterDetailDialog({ open, loading, character, error, onClose }: CharacterDetailDialogProps) {
  const fetchWithAuth = useFetchWithAuth();
  const [relationTypeDraft, setRelationTypeDraft] = React.useState("");
  const [relationTypeFilter, setRelationTypeFilter] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setRelationTypeDraft("");
      setRelationTypeFilter(undefined);
    }
  }, [open, character?.characterId]);

  const relationshipsKey =
    open && character ? ["character-relationships", character.characterId, relationTypeFilter ?? ""] : null;

  const {
    data: relationshipData,
    isLoading: relationshipLoading,
    error: relationshipError,
    mutate: refreshRelationships,
  } = useSWR<CharacterRelationshipEdge[]>(
    relationshipsKey,
    async ([, characterId, relationType]) => {
      const payload = relationType ? { relationType } : {};
      const res = await fetchWithAuth(`/api/v1/novels/characters/${characterId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const message = err?.message?.message || err?.message || `关系数据获取失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }
      const json = await res.json().catch(() => ({}));
      return extractRelationships(json);
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const relationships = relationshipData ?? [];

  const handleRelationQuery = () => {
    setRelationTypeFilter(relationTypeDraft.trim() || undefined);
  };

  const handleRelationReset = () => {
    setRelationTypeDraft("");
    setRelationTypeFilter(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>角色详情</DialogTitle>
          <DialogDescription>查看角色基础信息、特质与背景描述。</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : character ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs uppercase">角色名称</Label>
                <div className="mt-1 text-base font-medium">{character.name}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">角色定位</Label>
                <div className="text-muted-foreground mt-1 text-sm">{character.role || "未设置"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">角色 ID</Label>
                <div className="text-muted-foreground mt-1 font-mono text-sm">{character.characterId}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">所属小说 ID</Label>
                <div className="text-muted-foreground mt-1 text-sm">{character.novelId || "未关联"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">创建时间</Label>
                <div className="text-muted-foreground mt-1 text-sm">{formatDateTime(character.createdAt)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">更新时间</Label>
                <div className="text-muted-foreground mt-1 text-sm">{formatDateTime(character.updatedAt)}</div>
              </div>
              {character.createdBy && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">创建人</Label>
                  <div className="text-muted-foreground mt-1 text-sm">{character.createdBy}</div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground text-xs uppercase">性格特质</Label>
              <div className="mt-2">{renderTraits(character.traits)}</div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs uppercase">角色背景</Label>
              <div className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                {character.background?.trim() ? character.background : "暂无背景描述"}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">角色关系</Label>
                  <div className="text-muted-foreground mt-1 text-sm">可按关系类型过滤，例如输入“朋友”或“仇人”。</div>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                  <Input
                    placeholder="关系类型"
                    value={relationTypeDraft}
                    onChange={(event) => setRelationTypeDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleRelationQuery();
                      }
                    }}
                    className="md:w-40"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleRelationQuery} disabled={relationshipLoading}>
                      <Search className="mr-2 h-4 w-4" /> 查询
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRelationReset}
                      disabled={relationshipLoading && !relationTypeFilter}
                    >
                      清空
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refreshRelationships()}
                      disabled={relationshipLoading}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" /> 刷新
                    </Button>
                  </div>
                </div>
              </div>

              {relationshipLoading ? (
                <div className="space-y-2 rounded-md border p-4">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ) : relationshipError ? (
                <div className="text-destructive text-sm">
                  {(relationshipError as Error)?.message || "获取角色关系失败"}
                </div>
              ) : relationships.length ? (
                <div className="space-y-3">
                  {relationships.map((item) => (
                    <div key={`${item.characterId}-${item.relationType}`} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.relationType || "未标记"}</Badge>
                          <span className="font-medium">对方角色：{item.name || item.characterId}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">暂无关系数据。</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">请选择要查看的角色。</div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
