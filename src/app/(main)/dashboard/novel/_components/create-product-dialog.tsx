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
import { WorkStatus } from "@/types/work";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// CreateWorkDto 对应的前端校验
const createWorkSchema = z.object({
  title: z.string({ required_error: "作品标题不能为空" }).min(1, "请输入作品标题"),
  description: z.string().max(1000, "描述不能超过1000个字符").optional().or(z.literal("")),
  status: z.nativeEnum(WorkStatus).optional(),
});

export type CreateWorkInput = z.infer<typeof createWorkSchema>;

// 注意：为兼容现有引用，仍导出 CreateProductDialog 名称
export function CreateProductDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CreateWorkInput>({
    resolver: zodResolver(createWorkSchema),
    defaultValues: {
      title: "",
      description: "",
      status: WorkStatus.DRAFT,
    },
  });

  const onSubmit = async (values: CreateWorkInput) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (!payload.description) delete payload.description;

      const res = await fetchWithAuth("/api/v1/novels/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `创建失败: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      toast.success("作品创建成功");
      onOpenChange(false);
      form.reset();
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.message || "创建作品失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新增作品</DialogTitle>
          <DialogDescription>填写作品信息，提交后将创建新作品。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作品标题</FormLabel>
                  <FormControl>
                    <Input placeholder="如：Mars Detective" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作品描述（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A detective story set on Mars." className="min-h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作品状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择作品状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={WorkStatus.DRAFT}>草稿</SelectItem>
                      <SelectItem value={WorkStatus.PUBLISHED}>已发布</SelectItem>
                      <SelectItem value={WorkStatus.ARCHIVED}>已归档</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "创建作品"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
