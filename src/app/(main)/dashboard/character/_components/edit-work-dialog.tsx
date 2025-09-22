"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";
import { Character } from "@/types/work";

const schema = z.object({
  name: z.string({ required_error: "请输入角色名称" }).min(1, "角色名称不能为空"),
  role: z.string().max(200, "角色定位请不要超过200个字符").optional().or(z.literal("")),
  traits: z.string().max(500, "性格特质请控制在500个字符以内").optional().or(z.literal("")),
  background: z.string().max(2000, "背景描述请控制在2000个字符以内").optional().or(z.literal("")),
  novelId: z.string().max(100, "小说 ID 请控制在100个字符以内").optional().or(z.literal("")),
});

export type EditCharacterInput = z.infer<typeof schema>;

export function EditCharacterDialog({
  open,
  onOpenChange,
  character,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  character: Character | null;
  onUpdated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EditCharacterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: character?.name || "",
      role: character?.role?.toString() || "",
      traits: Array.isArray(character?.traits) ? character?.traits.join("\n") : character?.traits?.toString() || "",
      background: character?.background || "",
      novelId: character?.novelId || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      name: character?.name || "",
      role: character?.role?.toString() || "",
      traits: Array.isArray(character?.traits) ? character?.traits.join("\n") : character?.traits?.toString() || "",
      background: character?.background || "",
      novelId: character?.novelId || "",
    });
  }, [character, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!character?.characterId) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
      };

      const traitsInput = values.traits ?? "";
      const traits = traitsInput
        .split(/\n|,|、/)
        .map((item) => item.trim())
        .filter(Boolean);

      const currentRole = character?.role ?? "";
      const normalizedRole = (values.role ?? "").trim();
      if (normalizedRole !== currentRole) {
        payload.role = normalizedRole;
      }

      const currentBackground = character?.background ?? "";
      const normalizedBackground = (values.background ?? "").trim();
      if (normalizedBackground !== currentBackground) {
        payload.background = normalizedBackground;
      }

      const currentNovelId = character?.novelId ?? "";
      const normalizedNovelId = (values.novelId ?? "").trim();
      if (normalizedNovelId !== currentNovelId) {
        payload.novelId = normalizedNovelId;
      }

      const originalTraits = Array.isArray(character?.traits)
        ? character?.traits
        : character?.traits
          ? String(character.traits)
              .split(/\n|,|、/)
              .map((item) => item.trim())
              .filter(Boolean)
          : [];
      const traitsChanged = traits.join("||") !== originalTraits.join("||");
      if (traitsChanged) {
        payload.traits = traits;
      }

      const res = await fetchWithAuth(`/api/v1/novels/characters/${character.characterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const message = err?.message?.message || err?.message || `更新失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }

      toast.success("角色已更新");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: any) {
      toast.error(e?.message || "更新角色失败");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>更新角色的名称、定位、特质等信息。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入角色名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色定位</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：主角 / 反派 / 配角" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="traits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>性格特质</FormLabel>
                  <FormControl>
                    <Textarea placeholder="使用逗号、顿号或换行分隔" className="min-h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色背景</FormLabel>
                  <FormControl>
                    <Textarea placeholder="补充角色的成长经历、关键事件等" className="min-h-28" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="novelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属小说 ID</FormLabel>
                  <FormControl>
                    <Input placeholder="输入关联的小说 ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中..." : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
