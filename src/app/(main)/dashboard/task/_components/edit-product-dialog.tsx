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
import { Product, ProductStatus, ProductType } from "@/types/product";

// 与创建表单保持一致的中文风险等级值
const RiskLevel = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
} as const;

// 编辑 DTO：此处按后端 CreateProductDto 的完整字段校验，全部必填
const editProductSchema = z
  .object({
    productName: z.string({ required_error: "产品名称不能为空" }).min(1, "请输入产品名称"),
    productType: z.nativeEnum(ProductType, { required_error: "请选择产品类型" }),
    description: z.string().max(1000, "产品描述不能超过1000个字符").optional().or(z.literal("")),
    riskLevel: z.enum([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH], { required_error: "风险等级不能为空" }),
    minInvestment: z.coerce.number({ invalid_type_error: "最低投资金额必须是数字" }).min(0, "不能小于0"),
    maxInvestment: z.coerce.number({ invalid_type_error: "最高投资金额必须是数字" }).min(0, "不能小于0"),
    expectedReturn: z.coerce.number({ invalid_type_error: "预期收益率必须是数字" }),
    interestPaymentDate: z.string({ required_error: "结息日期不能为空" }).min(1, "请输入结息日期"),
    maturityPeriod: z.coerce.number({ invalid_type_error: "产品期限必须是数字" }).min(0, "不能小于0"),
    status: z.nativeEnum(ProductStatus).optional(),
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

export type EditProductInput = z.infer<typeof editProductSchema>;

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  onUpdated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EditProductInput>({
    resolver: zodResolver(editProductSchema),
    values: {
      productName: product?.productName ?? "",
      productType: (product?.productType as any) ?? ProductType.WEALTH,
      description: product?.description ?? "",
      riskLevel: (product?.riskLevel as any) ?? RiskLevel.MEDIUM,
      minInvestment: product?.minInvestment ?? 0,
      maxInvestment: product?.maxInvestment ?? 0,
      expectedReturn: product?.expectedReturn ?? 0,
      interestPaymentDate: product?.interestPaymentDate ?? "",
      maturityPeriod: product?.maturityPeriod ?? 0,
      status: (product?.status as any) ?? ProductStatus.ACTIVE,
      salesStartDate: product?.salesStartDate ?? "",
      salesEndDate: product?.salesEndDate ?? "",
    },
  });

  React.useEffect(() => {
    form.reset({
      productName: product?.productName ?? "",
      productType: (product?.productType as any) ?? ProductType.WEALTH,
      description: product?.description ?? "",
      riskLevel: (product?.riskLevel as any) ?? RiskLevel.MEDIUM,
      minInvestment: product?.minInvestment ?? 0,
      maxInvestment: product?.maxInvestment ?? 0,
      expectedReturn: product?.expectedReturn ?? 0,
      interestPaymentDate: product?.interestPaymentDate ?? "",
      maturityPeriod: product?.maturityPeriod ?? 0,
      status: (product?.status as any) ?? ProductStatus.ACTIVE,
      salesStartDate: product?.salesStartDate ?? "",
      salesEndDate: product?.salesEndDate ?? "",
    });
  }, [product]);

  const onSubmit = async (values: EditProductInput) => {
    if (!product) return;
    setSubmitting(true);
    try {
      // description 为空字符串时不提交该字段
      const payload: Record<string, unknown> = { ...values };
      if (!payload.description) delete payload.description;

      const res = await fetchWithAuth(`/api/v1/products/${product.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `更新失败: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      toast.success("产品已更新");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: any) {
      toast.error(e?.message || "更新产品失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑产品</DialogTitle>
          <DialogDescription>修改产品信息，保存后生效。</DialogDescription>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>产品状态</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ProductStatus.ACTIVE}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择产品状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ProductStatus.ACTIVE}>上架</SelectItem>
                      <SelectItem value={ProductStatus.INACTIVE}>下架</SelectItem>
                      <SelectItem value={ProductStatus.SUSPENDED}>暂停</SelectItem>
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
                {submitting ? "保存中..." : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
