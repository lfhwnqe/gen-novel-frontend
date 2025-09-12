"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { ChartAreaInteractive } from "./_components/chart-area-interactive";
import { CustomerDataTable } from "./_components/data-table";
import { SectionCards } from "./_components/section-cards";
import { ProductType, Product } from "@/types/product";

// 后端统一响应包装
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  message?: unknown;
}

// 列表数据载荷（与后端统一返回结构对齐）
interface CustomerListData {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  // 产品筛选参数
  productType?: ProductType;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 导出接口响应
interface ExportResponse {
  downloadUrl: string;
  expireAt: string;
  fileName: string;
  objectKey: string;
  bucket: string;
  size: number;
}

// SWR fetcher for products data
const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取产品数据失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return (await res.json()) as ApiResponse<CustomerListData>;
};

export default function Page() {
  // 提交后用于请求的参数
  const [queryParams, setQueryParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  // 表单编辑中的待提交参数（不触发请求）
  const [formParams, setFormParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  // 是否允许发起查询
  const [enabled, setEnabled] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  // 构建请求 URL
  const paramsString = React.useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        sp.append(key, value.toString());
      }
    });
    return sp.toString();
  }, [queryParams]);

  const {
    data: result,
    error,
    isLoading,
    mutate,
  } = useSWR(enabled ? `/api/v1/products?${paramsString}` : null, fetcher, {
    keepPreviousData: true,
    shouldRetryOnError: false,
  });

  React.useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  // 注意：后端返回为 { success, data: { data: Product[], total, page, limit, totalPages } }
  const products = result?.data?.data ?? [];
  const total = result?.data?.total ?? 0;
  const page = result?.data?.page ?? queryParams.page ?? 1;
  const limit = result?.data?.limit ?? queryParams.limit ?? 10;
  const totalPages = result?.data?.totalPages ?? (limit ? Math.max(1, Math.ceil(total / limit)) : 1);

  const handleRefresh = () => {
    if (enabled) mutate();
  };

  // 分页交互：页码变化（1-based）
  const handlePageChange = (nextPage: number) => {
    setQueryParams((prev) => ({ ...(prev || {}), page: Math.max(1, nextPage) }));
    setEnabled(true);
  };

  // 分页交互：每页数量变化
  const handlePageSizeChange = (nextSize: number) => {
    setQueryParams((prev) => ({ ...(prev || {}), limit: nextSize, page: 1 }));
    setEnabled(true);
  };

  // 仅更新表单参数，不触发请求
  const handleSearch = (query: string) => {
    setFormParams((prev) => ({ ...prev, search: query, page: 1 }));
  };

  // 仅更新表单参数，不触发请求
  // 适配产品筛选参数：仅接收 status、productType，忽略旧的 riskLevel
  const handleFilter = (filters: any) => {
    setFormParams((prev) => ({
      ...prev,
      status: filters?.status,
      productType: filters?.productType,
      page: 1,
    }));
  };

  // 点击“查询”按钮时提交表单参数并发起请求
  const handleQuery = () => {
    setQueryParams(formParams);
    setEnabled(true);
  };

  // 导出（按当前表单筛选条件）
  const handleExport = async () => {
    try {
      setExporting(true);
      const sp = new URLSearchParams();
      Object.entries(formParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          sp.append(key, value.toString());
        }
      });
      const url = `/api/v1/products/export${sp.toString() ? `?${sp.toString()}` : ""}`;
      const res = await fetchWithAuth(url, { method: "GET" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}) as any);
        const message =
          errorData?.message?.message ||
          errorData?.message ||
          errorData?.error ||
          "" ||
          `导出失败: ${res.status} ${res.statusText}`;
        throw new Error(message);
      }
      const json = await res.json();
      const payload: ExportResponse | undefined =
        json && typeof json === "object" && "success" in json && "data" in json
          ? (json.data as ExportResponse)
          : (json as ExportResponse);
      if (!payload?.downloadUrl) {
        throw new Error("导出接口未返回下载链接");
      }
      const a = document.createElement("a");
      a.href = payload.downloadUrl;
      a.download = payload.fileName || "products.xlsx";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`已开始下载：${payload.fileName || "products.xlsx"}`);
    } catch (err: any) {
      toast.error(err?.message || "导出失败，请稍后重试");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* <SectionCards />
      <ChartAreaInteractive /> */}
      <CustomerDataTable
        data={products}
        loading={isLoading}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onQuery={handleQuery}
        onExport={handleExport}
        exporting={exporting}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    </div>
  );
}
