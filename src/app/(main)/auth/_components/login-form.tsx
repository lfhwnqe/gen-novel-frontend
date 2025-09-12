"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setAuthTokens } from "@/lib/auth";
import type { AuthTokens } from "@/types/auth";

const FormSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // 兼容新后端返回格式：{ success, data: { accessToken, idToken, refreshToken, ... } }
        const dataWrapper = result?.data ?? result;

        const accessToken: string | undefined = dataWrapper?.accessToken;
        const idToken: string | undefined = dataWrapper?.idToken;
        const refreshToken: string | undefined = dataWrapper?.refreshToken;

        // 从 idToken 解析用户信息（JWT base64url 解码）
        const parseJwtPayload = (token?: string): Record<string, any> | null => {
          if (!token || typeof token !== "string") return null;
          try {
            const parts = token.split(".");
            if (parts.length < 2) return null;
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
                .join(""),
            );
            return JSON.parse(json);
          } catch {
            return null;
          }
        };

        const payload = parseJwtPayload(idToken) || {};

        // 构造现有前端所需的 AuthTokens 结构
        const getStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
        const emailStr = getStr(payload.email);

        const mapped: AuthTokens | null = accessToken
          ? {
              access_token: accessToken,
              user: {
                userId: getStr(payload.sub) || getStr(payload.userId) || "",
                username:
                  getStr(payload["cognito:username"]) ||
                  getStr(payload.username) ||
                  (emailStr ? emailStr.split("@")[0] : ""),
                email: emailStr || "",
                role: payload["cognito:groups"]?.[0] || "user",
              },
            }
          : null;

        if (mapped && mapped.access_token && mapped.user) {
          // 写入 refreshToken（供 /api/auth/refresh 使用）
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }

          setAuthTokens(mapped);
          toast.success("登录成功！");

          // 登录后重定向
          const redirectPath = typeof window !== "undefined" ? localStorage.getItem("redirectAfterLogin") : null;
          if (redirectPath) localStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath || "/dashboard");
        } else {
          toast.error("登录响应格式不符合预期，请联系管理员。");
        }
      } else {
        // 使用后端返回的错误信息（兼容 message 为对象或字符串的情况）
        const errorMessage = (() => {
          const msg = result?.message;
          if (typeof msg === "string" && msg.trim()) return msg;
          if (msg && typeof msg === "object") {
            if (typeof msg.message === "string" && msg.message.trim()) return msg.message;
            if (typeof msg.error === "string" && msg.error.trim()) return msg.error;
          }
          if (typeof result?.error === "string" && result.error.trim()) return result.error;
          // 根据常见 401 返回给出更友好的提示
          if (response.status === 401) return "用户名或密码错误";
          return "登录失败，请稍后重试。";
        })();
        toast.error(String(errorMessage));
      }
    } catch (error) {
      console.error("Login request failed:", error);
      toast.error("网络错误，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input id="username" type="text" placeholder="your_username" autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center">
                <FormControl>
                  <Checkbox
                    id="login-remember"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="size-4"
                  />
                </FormControl>
                <FormLabel htmlFor="login-remember" className="text-muted-foreground ml-1 text-sm font-medium">
                  Remember me for 30 days
                </FormLabel>
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit">
            {isSubmitting ? "登录中..." : "Login"}
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
