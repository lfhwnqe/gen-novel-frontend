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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";
import { Work, WorkStatus } from "@/types/work";

const formSchema = z.object({
  title: z.string({ required_error: "作品标题不能为空" }).min(1, "请输入作品标题"),
  description: z.string().max(1000, "描述不能超过1000个字符").optional().or(z.literal("")),
  status: z.nativeEnum(WorkStatus, { required_error: "请选择作品状态" }),
});

type EditWorkInput = z.infer<typeof formSchema>;

export function EditWorkDialog({
  open,
  onOpenChange,
  work,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  work: Partial<Work> | null;
  onUpdated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EditWorkInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: work?.title || "",
      description: work?.description || "",
      status: (work?.status as WorkStatus) || WorkStatus.DRAFT,
    },
  });

  React.useEffect(() => {
    form.reset({
      title: work?.title || "",
      description: work?.description || "",
      status: (work?.status as WorkStatus) || WorkStatus.DRAFT,
    });
  }, [work?.novelId]);

  const onSubmit = async (values: EditWorkInput) => {
    if (!work?.novelId) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/v1/novels/works/${work.novelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `更新失败: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      toast.success("作品已更新");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: any) {
      toast.error(e?.message || "更新作品失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>编辑作品</DialogTitle>
          <DialogDescription>修改作品的标题、状态与描述。</DialogDescription>
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
                    <Input placeholder="如：重生之快递大亨" {...field} />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>作品描述（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="作品简介..." className="min-h-24" {...field} />
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
