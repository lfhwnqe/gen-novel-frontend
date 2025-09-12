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
import { ProductType } from "@/types/product";
import { Textarea } from "@/components/ui/textarea";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";

// 风险等级（与现有客户模块保持中文：低/中/高）
const RiskLevel = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
} as const;

// 可选：产品状态（当前不在表单展示）与后端保持一致
const ProductStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

const createProductSchema = z
  .object({
    productName: z.string({ required_error: "产品名称不能为空" }).min(1, "请输入产品名称"),
    // 使用共享 ProductType 枚举
    productType: z.nativeEnum(ProductType, { required_error: "请选择产品类型" }),
    description: z.string().max(1000, "产品描述不能超过1000个字符").optional().or(z.literal("")),
    riskLevel: z.enum([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH], { required_error: "风险等级不能为空" }),
    minInvestment: z.coerce.number({ invalid_type_error: "最低投资金额必须是数字" }).min(0, "不能小于0"),
    maxInvestment: z.coerce.number({ invalid_type_error: "最高投资金额必须是数字" }).min(0, "不能小于0"),
    expectedReturn: z.coerce.number({ invalid_type_error: "预期收益率必须是数字" }),
    interestPaymentDate: z.string({ required_error: "结息日期不能为空" }).min(1, "请输入结息日期"),
    maturityPeriod: z.coerce.number({ invalid_type_error: "产品期限必须是数字" }).min(0, "不能小于0"),
    // status: z.enum([ProductStatus.ACTIVE, ProductStatus.INACTIVE]).optional(),
    salesStartDate: z
      .string({ required_error: "销售开始日期不能为空" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "请输入有效日期 YYYY-MM-DD"),
    salesEndDate: z
      .string({ required_error: "销售结束日期不能为空" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "请输入有效日期 YYYY-MM-DD"),
  })
  .refine((val) => val.maxInvestment >= val.minInvestment, {
    message: "最高投资金额需大于等于最低投资金额",
    path: ["maxInvestment"],
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;

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

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      productName: "",
      productType: ProductType.WEALTH,
      description: "",
      riskLevel: RiskLevel.MEDIUM,
      minInvestment: 0,
      maxInvestment: 0,
      expectedReturn: 0,
      interestPaymentDate: "每月",
      maturityPeriod: 0,
      salesStartDate: "",
      salesEndDate: "",
    },
  });

  const onSubmit = async (values: CreateProductInput) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (!payload.description) delete payload.description;

      const res = await fetchWithAuth("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `创建失败: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      toast.success("产品创建成功");
      onOpenChange(false);
      form.reset();
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.message || "创建产品失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增产品</DialogTitle>
          <DialogDescription>填写产品信息，提交后将创建新产品。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>产品名称</FormLabel>
                  <FormControl>
                    <Input placeholder="如：稳健理财产品" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>产品类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择产品类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ProductType.WEALTH}>理财</SelectItem>
                      <SelectItem value={ProductType.FUND}>基金</SelectItem>
                      <SelectItem value={ProductType.BOND}>债券</SelectItem>
                      <SelectItem value={ProductType.INSURANCE}>保险</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="minInvestment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最低投资金额</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="例如：1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxInvestment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最高投资金额</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="例如：100000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedReturn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预期年化收益率(%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="例如：5" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestPaymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>结息日期</FormLabel>
                  <FormControl>
                    <Input placeholder="如：每月/每季/到期" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maturityPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>产品期限(天)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="例如：365" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>销售开始日期</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>销售结束日期</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>产品描述（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="产品的简单介绍与备注" className="min-h-24" {...field} />
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
                {submitting ? "提交中..." : "创建产品"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
