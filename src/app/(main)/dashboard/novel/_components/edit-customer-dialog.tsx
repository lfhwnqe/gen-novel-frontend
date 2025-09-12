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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";

import { Customer, CustomerStatus, IdType, RiskLevel } from "./schema";

const phoneRegex = /^(\+86\s?)?1[3-9]\d{9}$/;

// Update DTO（全部可选）
const updateCustomerSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址" }).optional(),
  phone: z.string().regex(phoneRegex, "请输入有效的中国大陆手机号码").optional(),
  firstName: z.string().min(1, "名至少需要1个字符").max(50, "名不能超过50个字符").optional(),
  lastName: z.string().min(1, "姓至少需要1个字符").max(50, "姓不能超过50个字符").optional(),
  idType: z.enum([IdType.ID_CARD, IdType.PASSPORT, IdType.OTHER]).optional(),
  idNumber: z.string().min(6, "身份证件号码至少需要6个字符").max(30, "身份证件号码不能超过30个字符").optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "请输入有效的日期格式 (YYYY-MM-DD)")
    .optional(),
  address: z.string().min(5, "联系地址至少需要5个字符").max(200, "联系地址不能超过200个字符").optional(),
  riskLevel: z.enum([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]).optional(),
  status: z.enum([CustomerStatus.ACTIVE, CustomerStatus.INACTIVE, CustomerStatus.SUSPENDED]).optional(),
  remarks: z.string().max(1000, "备注信息不能超过1000个字符").optional(),
  // 允许为空字符串，提交时会转换为 undefined
  wechatId: z.string().min(1, "微信号至少需要1个字符").max(50, "微信号不能超过50个字符").optional().or(z.literal("")),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer | null;
  onUpdated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
    values: {
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      firstName: customer?.firstName ?? "",
      lastName: customer?.lastName ?? "",
      idType: (customer?.idType as any) ?? IdType.ID_CARD,
      idNumber: customer?.idNumber ?? "",
      dateOfBirth: customer?.dateOfBirth ?? "",
      address: customer?.address ?? "",
      riskLevel: (customer?.riskLevel as any) ?? RiskLevel.MEDIUM,
      status: (customer?.status as any) ?? CustomerStatus.ACTIVE,
      remarks: customer?.remarks ?? "",
      wechatId: customer?.wechatId ?? "",
    },
  });

  React.useEffect(() => {
    // 当 customer 变化时，同步到表单
    form.reset({
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      firstName: customer?.firstName ?? "",
      lastName: customer?.lastName ?? "",
      idType: (customer?.idType as any) ?? IdType.ID_CARD,
      idNumber: customer?.idNumber ?? "",
      dateOfBirth: customer?.dateOfBirth ?? "",
      address: customer?.address ?? "",
      riskLevel: (customer?.riskLevel as any) ?? RiskLevel.MEDIUM,
      status: (customer?.status as any) ?? CustomerStatus.ACTIVE,
      remarks: customer?.remarks ?? "",
      wechatId: customer?.wechatId ?? "",
    });
  }, [customer]);

  const onSubmit = async (values: UpdateCustomerInput) => {
    if (!customer) return;
    setSubmitting(true);
    try {
      // 将空字符串转为 undefined，避免覆盖为空
      const payload: Record<string, unknown> = { ...values };
      for (const key of Object.keys(payload)) {
        if ((payload as any)[key] === "") {
          delete (payload as any)[key];
        }
      }

      const res = await fetchWithAuth(`/api/v1/customers/${customer.customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `更新失败: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      toast.success("客户信息已更新");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: any) {
      toast.error(e?.message || "更新客户失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑客户</DialogTitle>
          <DialogDescription>修改客户信息，保存后生效。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号码</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：13800138000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名</FormLabel>
                  <FormControl>
                    <Input placeholder="小明" {...field} />
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
                  <FormLabel>姓</FormLabel>
                  <FormControl>
                    <Input placeholder="张" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>证件类型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择证件类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={IdType.ID_CARD}>身份证</SelectItem>
                      <SelectItem value={IdType.PASSPORT}>护照</SelectItem>
                      <SelectItem value={IdType.OTHER}>其他</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>证件号码</FormLabel>
                  <FormControl>
                    <Input placeholder="110101199001011234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出生日期</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>联系地址</FormLabel>
                  <FormControl>
                    <Input placeholder="北京市朝阳区某某街道123号" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>风险等级</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择风险等级" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RiskLevel.LOW}>低</SelectItem>
                      <SelectItem value={RiskLevel.MEDIUM}>中</SelectItem>
                      <SelectItem value={RiskLevel.HIGH}>高</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>客户状态</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择客户状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CustomerStatus.ACTIVE}>活跃</SelectItem>
                      <SelectItem value={CustomerStatus.INACTIVE}>非活跃</SelectItem>
                      <SelectItem value={CustomerStatus.SUSPENDED}>暂停</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wechatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>微信号（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="wechat_user123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>备注（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="重要客户，需要特别关注" className="min-h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2 md:col-span-2">
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
