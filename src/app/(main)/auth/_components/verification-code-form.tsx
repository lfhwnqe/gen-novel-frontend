"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { debugApiCall } from "@/lib/api-debug";

const FormSchema = z.object({
  verificationCode: z
    .string()
    .length(6, { message: "验证码必须是6位数字" })
    .regex(/^\d{6}$/, { message: "验证码只能包含数字" }),
});

interface VerificationCodeFormProps {
  username: string;
  email: string;
  password: string;
  onBack: () => void;
}

export function VerificationCodeForm({ username, email, password: _password, onBack }: VerificationCodeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  // 处理验证码输入格式化
  const handleVerificationCodeChange = (value: string) => {
    // 只允许数字，最多6位
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    form.setValue("verificationCode", numericValue);
  };

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 初始化倒计时
  useEffect(() => {
    setCountdown(60); // 60秒倒计时
  }, []);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      const verifyDebug = await debugApiCall("/api/v1/auth/verify-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          verificationCode: data.verificationCode,
        }),
      });

      const statusCode = verifyDebug.response?.status ?? 0;
      if (verifyDebug.response && statusCode >= 200 && statusCode < 300) {
        // 兼容响应壳：{ success, data: { message, verified } }
        const responseData = verifyDebug.response.data;
        const payload = responseData?.data ?? responseData;
        const verified = payload?.verified === true;
        const success = responseData?.success === true || verified;

        if (success) {
          const msg = payload?.message || "邮箱验证成功！";
          toast.success(msg);
          // 成功后跳转至登录页（不自动登录）
          router.push("/auth/v1/login");
          return;
        } else {
          const msg = payload?.message || "邮箱验证失败，请稍后重试。";
          toast.error(msg);
          form.setValue("verificationCode", "");
        }
      } else {
        // 处理验证错误
        let errorMessage = "验证码验证失败，请检查验证码是否正确。";

        if (verifyDebug.response?.status === 400) {
          // 错误响应可能直接包含message，也可能在data字段中
          const errorData = verifyDebug.response.data;
          const responseMessage = errorData?.message || errorData?.data?.message;
          if (responseMessage?.includes("expired")) {
            errorMessage = "验证码已过期，请重新获取验证码。";
          } else if (responseMessage?.includes("invalid") || responseMessage?.includes("incorrect")) {
            errorMessage = "验证码错误，请检查后重新输入。";
          } else {
            errorMessage = responseMessage ?? "验证码格式错误或已过期。";
          }
        } else if (verifyDebug.response?.status === 409) {
          errorMessage = "用户已经验证过了，请直接登录。";
        } else if (verifyDebug.response?.status === 404) {
          errorMessage = "用户不存在，请重新注册。";
        } else if (verifyDebug.error) {
          errorMessage = `网络错误: ${verifyDebug.error}`;
        }

        toast.error(errorMessage);
        console.error("Verification failed:", verifyDebug);

        // 如果是验证码错误，清空输入框让用户重新输入
        if (verifyDebug.response?.status === 400) {
          form.setValue("verificationCode", "");
        }
      }
    } catch (error) {
      console.error("Verification request failed:", error);
      toast.error("网络错误，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      // 重新发送验证码 - 调用AWS Cognito的重发验证码接口
      const resendDebug = await debugApiCall("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
        }),
      });

      if (resendDebug.response?.status === 200) {
        toast.success("验证码已重新发送，请检查您的邮箱。");
        setCountdown(60); // 重新开始倒计时
      } else {
        // 如果重发接口不存在，提示用户
        toast.info("重发验证码功能暂未实现。如果没有收到验证码，请稍后重试注册。");
      }
    } catch (error) {
      console.error("Resend code failed:", error);
      toast.info("重发验证码功能暂未实现。如果没有收到验证码，请稍后重试注册。");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">验证您的邮箱</h2>
        <p className="text-muted-foreground text-sm">
          我们已向 <span className="font-medium">{email}</span> 发送了一个6位数验证码
        </p>
        <p className="text-muted-foreground text-xs">请检查您的邮箱（包括垃圾邮件文件夹）并输入验证码</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isSubmitting} className="space-y-4">
            <FormField
              control={form.control}
              name="verificationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>验证码</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      autoComplete="one-time-code"
                      onChange={(e) => handleVerificationCodeChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "验证中..." : "验证并前往登录"}
            </Button>
          </fieldset>
        </form>
      </Form>

      <div className="space-y-4 text-center">
        <div className="text-sm">
          <span className="text-muted-foreground">没有收到验证码？</span>
          <Button
            variant="link"
            className="h-auto p-0 font-normal"
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
          >
            {countdown > 0 ? `${countdown}秒后可重发` : isResending ? "重发中..." : "重新发送"}
          </Button>
        </div>

        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          返回注册
        </Button>
      </div>
    </div>
  );
}
