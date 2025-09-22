"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X } from "lucide-react";

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

import { NovelSelect } from "./novel-select";

const schema = z.object({
  name: z.string({ required_error: "请输入角色名称" }).min(1, "角色名称不能为空"),
  role: z.string().max(200, "角色定位请不要超过200个字符").optional().or(z.literal("")),
  traits: z.array(z.string().min(1, "性格特质不能为空").max(100, "单个特质请控制在100个字符以内")).optional(),
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
  const [traitDraft, setTraitDraft] = React.useState("");

  const convertTraits = React.useCallback((input: Character | null): string[] => {
    if (!input?.traits) return [];
    if (Array.isArray(input.traits)) return input.traits.filter(Boolean).map((item) => item.toString());
    return String(input.traits)
      .split(/\n|,|、/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, []);

  const form = useForm<EditCharacterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: character?.name || "",
      role: character?.role?.toString() || "",
      traits: convertTraits(character),
      background: character?.background || "",
      novelId: character?.novelId || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      name: character?.name || "",
      role: character?.role?.toString() || "",
      traits: convertTraits(character),
      background: character?.background || "",
      novelId: character?.novelId || "",
    });
    setTraitDraft("");
  }, [character?.characterId, convertTraits, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!character?.characterId) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
      };

      const role = values.role?.trim();
      const background = values.background?.trim();
      const novelId = values.novelId?.trim();
      const traits = values.traits?.map((trait) => trait.trim()).filter(Boolean) ?? [];

      if (role !== undefined) payload.role = role;
      if (background !== undefined) payload.background = background;
      if (novelId !== undefined) payload.novelId = novelId;
      payload.traits = traits;

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
                    <Input placeholder="输入角色名称" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="例如：主角 / 反派 / 配角" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="traits"
              render={({ field }) => {
                const traits = field.value ?? [];

                const handleAddTrait = () => {
                  const value = traitDraft.trim();
                  if (!value) return;
                  if (traits.includes(value)) {
                    toast.warning("该特质已存在");
                    setTraitDraft("");
                    return;
                  }
                  const next = [...traits, value];
                  field.onChange(next);
                  setTraitDraft("");
                };

                const handleRemoveTrait = (index: number) => {
                  const next = traits.filter((_, i) => i !== index);
                  field.onChange(next);
                };

                return (
                  <FormItem>
                    <FormLabel>性格特质</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {traits.length ? (
                          <div className="flex flex-wrap gap-2">
                            {traits.map((trait, index) => (
                              <span
                                key={`${trait}-${index}`}
                                className="bg-muted text-muted-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                              >
                                <span className="text-foreground text-sm">{trait}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTrait(index)}
                                  className="text-muted-foreground hover:text-foreground transition"
                                  aria-label={`移除特质 ${trait}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">暂未添加特质</div>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            placeholder="输入特质，回车或点击添加"
                            value={traitDraft}
                            onChange={(event) => setTraitDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleAddTrait();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={handleAddTrait}>
                            添加特质
                          </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">建议输入 1-100 字符的关键词，重复项会自动忽略。</p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色背景</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="补充角色的成长经历、关键事件等"
                      className="min-h-28"
                      {...field}
                      value={field.value ?? ""}
                    />
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
                    <NovelSelect
                      value={field.value ? field.value : undefined}
                      onChange={(val) => field.onChange(val ?? "")}
                      open={open}
                    />
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
