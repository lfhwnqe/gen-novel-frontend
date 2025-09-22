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

const schema = z.object({
  name: z.string({ required_error: "角色名称不能为空" }).min(1, "请输入角色名称"),
  role: z.string().max(200, "角色定位请不要超过200个字符").optional().or(z.literal("")),
  traits: z.string().max(500, "性格特质请控制在500个字符以内").optional().or(z.literal("")),
  background: z.string().max(2000, "背景描述请控制在2000个字符以内").optional().or(z.literal("")),
  novelId: z.string().max(100, "小说 ID 请控制在100个字符以内").optional().or(z.literal("")),
});

export type CreateCharacterInput = z.infer<typeof schema>;

export function CreateCharacterDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onCreated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CreateCharacterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      role: "",
      traits: "",
      background: "",
      novelId: "",
    },
  });

  const resetForm = React.useCallback(() => {
    form.reset({ name: "", role: "", traits: "", background: "", novelId: "" });
  }, [form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
      };

      if (values.role?.trim()) payload.role = values.role.trim();
      if (values.background?.trim()) payload.background = values.background.trim();
      if (values.novelId?.trim()) payload.novelId = values.novelId.trim();

      if (values.traits?.trim()) {
        const traits = values.traits
          .split(/\n|,|、/)
          .map((item) => item.trim())
          .filter(Boolean);
        if (traits.length) payload.traits = traits;
      }

      const res = await fetchWithAuth("/api/v1/novels/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const message = err?.message?.message || err?.message || `创建失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }

      toast.success("角色创建成功");
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.message || "创建角色失败");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新增角色</DialogTitle>
          <DialogDescription>填写角色基础信息，保存后即可在列表中查看。</DialogDescription>
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
                    <Input placeholder="例如：林晓夏" {...field} />
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
                  <FormLabel>角色定位（可选）</FormLabel>
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
                  <FormLabel>性格特质（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="使用逗号、顿号或换行分隔，例如：勇敢、敏锐、善于共情"
                      className="min-h-24"
                      {...field}
                    />
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
                  <FormLabel>角色背景（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="简要描述角色出身、经历等" className="min-h-28" {...field} />
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
                  <FormLabel>所属小说 ID（可选）</FormLabel>
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
                {submitting ? "提交中..." : "创建角色"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
