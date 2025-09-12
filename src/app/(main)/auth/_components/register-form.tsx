"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setAuthTokens } from "@/lib/auth";
import { debugApiCall } from "@/lib/api-debug";
import { VerificationCodeForm } from "./verification-code-form";

const FormSchema = z
  .object({
    username: z.string().min(3, { message: "Username must be at least 3 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      }),
    confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters." }),
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().min(1, { message: "Last name is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registrationData, setRegistrationData] = useState<{
    username: string;
    email: string;
    password: string;
  } | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      // 使用调试工具调用注册接口
      const registerDebug = await debugApiCall("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      if (registerDebug.response?.status === 200 || registerDebug.response?.status === 201) {
        const responseData = registerDebug.response.data;

        // 后端使用TransformInterceptor包装响应，实际数据在data字段中
        const actualData = responseData.data || responseData;

        // 检查是否需要验证码验证
        if (actualData.requiresVerification) {
          toast.success("注册成功！请检查您的邮箱获取验证码。");

          // 保存注册数据并切换到验证步骤
          setRegistrationData({
            username: data.username,
            email: data.email,
            password: data.password,
          });
          setStep("verify");
        } else {
          // 如果不需要验证，直接登录
          toast.success("注册成功！正在为您登录...");
          // 统一使用后端响应的 AuthTokens 结构：{ access_token, user }
          if (actualData?.access_token && actualData?.user) {
            setAuthTokens(actualData);
            router.push("/dashboard");
          } else {
            // 如果未返回 token，则引导用户去登录
            router.push("/auth/v1/login");
          }
        }
      } else {
        // 处理注册错误
        let errorMessage = "注册失败，请检查输入信息。";

        if (registerDebug.response?.status === 500) {
          errorMessage = "服务器内部错误，请稍后重试或联系管理员。";
        } else if (registerDebug.response?.status === 400) {
          const errorData = registerDebug.response.data;
          const responseMessage = errorData?.message || errorData?.data?.message;
          errorMessage = responseMessage ?? "请求参数错误，请检查输入信息。";
        } else if (registerDebug.response?.status === 401) {
          errorMessage = "用户已存在，请使用其他用户名或邮箱。";
        } else if (registerDebug.response?.status === 409) {
          errorMessage = "用户名或邮箱已存在，请使用其他信息。";
        } else if (registerDebug.error) {
          errorMessage = `网络错误: ${registerDebug.error}`;
        }

        toast.error(errorMessage);
        console.error("Registration failed:", registerDebug);
      }
    } catch (error) {
      console.error("Registration request failed:", error);
      toast.error("网络错误，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToRegister = () => {
    setStep("register");
    setRegistrationData(null);
  };

  // 根据步骤显示不同的组件
  if (step === "verify" && registrationData) {
    return (
      <VerificationCodeForm
        username={registrationData.username}
        email={registrationData.email}
        password={registrationData.password}
        onBack={handleBackToRegister}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input id="firstName" type="text" placeholder="John" autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input id="lastName" type="text" placeholder="Doe" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
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
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit">
            {isSubmitting ? "注册中..." : "Register"}
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
