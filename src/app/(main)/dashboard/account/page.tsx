"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthStore } from "@/stores/auth/auth-store";
import { fetchWithAuth } from "@/utils/fetch-with-auth";

const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, { message: "请输入当前密码" }),
    newPassword: z.string().min(8, { message: "新密码至少需要 8 个字符" }),
    confirmPassword: z.string().min(1, { message: "请再次输入新密码" }),
  })
  .refine((vals) => vals.newPassword === vals.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export default function Page() {
  const user = useAuthStore((s) => s.user);

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (data: z.infer<typeof ChangePasswordSchema>) => {
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: data.oldPassword, newPassword: data.newPassword }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (() => {
          const m = result?.message;
          if (typeof m === "string" && m.trim()) return m;
          if (m && typeof m === "object") {
            if (typeof m.message === "string" && m.message.trim()) return m.message;
            if (typeof m.error === "string" && m.error.trim()) return m.error;
          }
          if (typeof result?.error === "string" && result.error.trim()) return result.error;
          return "修改密码失败，请稍后重试";
        })();
        toast.error(msg as string);
        return;
      }
      toast.success("密码修改成功");
      form.reset();
    } catch (e) {
      toast.error("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>账号信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground">显示名</Label>
            <div>{user?.name || user?.username || "-"}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">用户名</Label>
            <div>{user?.username || "-"}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">邮箱</Label>
            <div>{user?.email || "-"}</div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">角色</Label>
            <div className="capitalize">{user?.role || "-"}</div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-muted-foreground">用户 ID</Label>
            <div className="break-all">{user?.userId || "-"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>更新登录密码，请妥善保管</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <fieldset disabled={submitting} className="space-y-4">
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>当前密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="至少 8 位" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认新密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="再次输入新密码" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="min-w-28">
                  {submitting ? "提交中..." : "保存"}
                </Button>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
