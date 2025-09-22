"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Character } from "@/types/work";

interface CharacterDetailDialogProps {
  open: boolean;
  loading: boolean;
  character: Character | null;
  error?: string | null;
  onClose: () => void;
}

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
