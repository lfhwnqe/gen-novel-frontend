"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";
import { Character } from "@/types/work";

import { NovelSelect } from "./novel-select";

const formSchema = z
  .object({
    characterAId: z.string({ required_error: "请选择角色A" }).min(1, "请选择角色A"),
    characterBId: z.string({ required_error: "请选择角色B" }).min(1, "请选择角色B"),
    newRelType: z.string({ required_error: "请输入新的关系类型" }).min(1, "请输入新的关系类型"),
    reason: z.string().max(500, "原因请控制在500个字符以内").optional().or(z.literal("")),
    chapterId: z.string().max(120, "章节ID请控制在120个字符以内").optional().or(z.literal("")),
    sceneId: z.string().max(120, "场景ID请控制在120个字符以内").optional().or(z.literal("")),
    novelId: z.string().max(120, "小说ID请控制在120个字符以内").optional().or(z.literal("")),
    occurredAt: z.string().max(64, "发生时间格式不正确").optional().or(z.literal("")),
    notes: z.string().max(1000, "备注请控制在1000个字符以内").optional().or(z.literal("")),
  })
  .refine((values) => values.characterAId !== values.characterBId, {
    message: "角色A与角色B不能相同",
    path: ["characterBId"],
  });

export type CreateRelationshipEventInput = z.infer<typeof formSchema>;

interface CreateRelationshipEventDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  initialCharacters?: Character[];
  initialSelection?: {
    characterAId?: string;
    characterBId?: string;
    novelId?: string;
  };
  onCreated?: () => void;
}

interface CharacterSearchParams {
  search?: string;
  novelId?: string;
}

const extractCharactersFromResponse = (input: unknown): Character[] => {
  if (!input || typeof input !== "object") return [];
  const record = input as Record<string, unknown>;
  if ("success" in record && "data" in record) {
    const data = record.data as Record<string, unknown> | undefined;
    if (data && "data" in data && Array.isArray((data as any).data)) {
      return (data as any).data as Character[];
    }
  }
  if ("data" in record && Array.isArray(record.data)) {
    return record.data as Character[];
  }
  return [];
};

function CharacterCombobox({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabledIds = [],
  novelId,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
  options: Character[];
  disabledIds?: string[];
  novelId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const fetchWithAuth = useFetchWithAuth();

  const query = React.useMemo<CharacterSearchParams>(() => {
    return {
      search: search.trim() || undefined,
      novelId: novelId?.trim() || undefined,
    };
  }, [search, novelId]);

  const {
    data: remoteOptions = [],
    isLoading,
    error: fetchError,
  } = useSWR(
    open ? ["relationship-character-options", query.search ?? "", query.novelId ?? ""] : null,
    async ([, searchValue, novelValue]) => {
      const params = new URLSearchParams({
        limit: "50",
        page: "1",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (searchValue) params.append("search", searchValue);
      if (novelValue) params.append("novelId", novelValue);

      const res = await fetchWithAuth(`/api/v1/novels/characters?${params.toString()}`, {
        method: "GET",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const message = err?.message?.message || err?.message || `获取角色列表失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }
      const json = await res.json().catch(() => ({}));
      return extractCharactersFromResponse(json);
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const mergedOptions = React.useMemo(() => {
    const map = new Map<string, Character>();
    options.forEach((item) => {
      map.set(item.characterId, item);
    });
    remoteOptions.forEach((item) => {
      map.set(item.characterId, item);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  }, [options, remoteOptions]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const selected = mergedOptions.find((item) => item.characterId === value);
  const buttonLabel = selected
    ? `${selected.name}${selected.novelName ? ` · ${selected.novelName}` : ""}`
    : value || placeholder;

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn("justify-between", !selected && !value && "text-muted-foreground")}
            >
              <span className="truncate text-left">
                {buttonLabel}
                {selected ? `（${selected.characterId}）` : value ? `（${value}）` : ""}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" side="bottom">
            <Command>
              <CommandInput placeholder="搜索角色名称或ID" value={search} onValueChange={(value) => setSearch(value)} />
              <CommandList>
                <CommandEmpty>
                  {fetchError ? fetchError.message : isLoading ? "加载中..." : "未找到相关角色"}
                </CommandEmpty>
                <CommandGroup>
                  {mergedOptions.map((item) => (
                    <CommandItem
                      key={item.characterId}
                      value={`${item.name} ${item.characterId}`}
                      disabled={disabledIds.includes(item.characterId)}
                      onSelect={() => {
                        onChange(item.characterId);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === item.characterId ? "opacity-100" : "opacity-0")} />
                      <span className="flex flex-col text-left">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {item.novelName ? `${item.novelName} · ${item.characterId}` : item.characterId}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export function CreateRelationshipEventDialog({
  open,
  onOpenChange,
  initialCharacters = [],
  initialSelection,
  onCreated,
}: CreateRelationshipEventDialogProps) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CreateRelationshipEventInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      characterAId: initialSelection?.characterAId ?? "",
      characterBId: initialSelection?.characterBId ?? "",
      newRelType: "",
      reason: "",
      chapterId: "",
      sceneId: "",
      novelId: initialSelection?.novelId ?? "",
      occurredAt: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        characterAId: initialSelection?.characterAId ?? "",
        characterBId: initialSelection?.characterBId ?? "",
        newRelType: "",
        reason: "",
        chapterId: "",
        sceneId: "",
        novelId: initialSelection?.novelId ?? "",
        occurredAt: "",
        notes: "",
      });
    }
  }, [open, initialSelection, form]);

  const characterAId = form.watch("characterAId");
  const characterBId = form.watch("characterBId");
  const selectedNovelId = form.watch("novelId");

  const initialOptions = React.useMemo(() => {
    return [...initialCharacters].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  }, [initialCharacters]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        characterAId: values.characterAId,
        characterBId: values.characterBId,
        newRelType: values.newRelType.trim(),
      };

      const maybeAppend = (key: keyof CreateRelationshipEventInput, targetKey?: string) => {
        const raw = values[key];
        const trimmed = typeof raw === "string" ? raw.trim() : raw;
        if (trimmed) {
          payload[targetKey ?? key] = trimmed;
        }
      };

      maybeAppend("reason");
      maybeAppend("chapterId");
      maybeAppend("sceneId");
      maybeAppend("novelId");
      maybeAppend("notes");

      if (values.occurredAt) {
        const date = new Date(values.occurredAt);
        if (Number.isNaN(date.getTime())) {
          throw new Error("事件发生时间格式无效，请重新选择");
        }
        payload.occurredAt = date.toISOString();
      }

      const res = await fetchWithAuth("/api/v1/novels/characters/relationships/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const message = err?.message?.message || err?.message || `创建失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }

      toast.success("关系事件创建成功");
      onOpenChange(false);
      onCreated?.();
    } catch (error: any) {
      toast.error(error?.message || "创建关系事件失败");
    } finally {
      setSubmitting(false);
    }
  });

  const handleClose = (value: boolean) => {
    if (!value) {
      form.reset({
        characterAId: "",
        characterBId: "",
        newRelType: "",
        reason: "",
        chapterId: "",
        sceneId: "",
        novelId: "",
        occurredAt: "",
        notes: "",
      });
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建角色关系事件</DialogTitle>
          <DialogDescription>选择两个角色并填写关系变更信息，提交后将记录一条新的关系事件。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="characterAId"
              render={({ field }) => (
                <CharacterCombobox
                  label="角色A"
                  placeholder="选择角色A"
                  value={field.value}
                  onChange={field.onChange}
                  options={initialOptions}
                  disabledIds={characterBId ? [characterBId] : []}
                  novelId={selectedNovelId || undefined}
                />
              )}
            />

            <FormField
              control={form.control}
              name="characterBId"
              render={({ field }) => (
                <CharacterCombobox
                  label="角色B"
                  placeholder="选择角色B"
                  value={field.value}
                  onChange={field.onChange}
                  options={initialOptions}
                  disabledIds={characterAId ? [characterAId] : []}
                  novelId={selectedNovelId || undefined}
                />
              )}
            />

            <FormField
              control={form.control}
              name="newRelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>变更后的关系类型</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：朋友 / 敌对" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>关系变更原因（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="简要说明此次关系变更的原因" rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>章节ID（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="与章节关联时填写" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sceneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>场景ID（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="与场景关联时填写" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="novelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>关联小说（可选）</FormLabel>
                  <FormControl>
                    <NovelSelect value={field.value || undefined} onChange={(val) => field.onChange(val ?? "")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>事件发生时间（可选）</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>补充备注（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="记录额外信息，例如情节背景或备注"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "创建事件"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
