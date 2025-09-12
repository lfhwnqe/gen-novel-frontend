"use client";

import * as React from "react";

import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductType, ProductStatus, Product } from "@/types/product";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { withDndColumn } from "../../../../../components/data-table/table-utils";
import { QueryActionBar } from "@/components/layouts/query-action-bar";

import { getProductColumns, dashboardColumns } from "./columns";
import { sectionSchema } from "./schema";
import { CreateProductDialog } from "./create-product-dialog";
import { EditProductDialog } from "./edit-product-dialog";
import { ImportProductDialog } from "./import-product-dialog";

// 客户数据表格组件
export function CustomerDataTable({
  data: initialData,
  loading = false,
  error = null,
  onRefresh,
  onSearch,
  onFilter,
  onQuery,
  onExport,
  exporting,
  onCreated,
  pagination,
}: {
  data: Product[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
  onQuery?: () => void;
  onExport?: () => void;
  exporting?: boolean;
  onCreated?: () => void;
  pagination?: {
    page: number; // 1-based
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void; // 1-based
    onPageSizeChange: (size: number) => void;
  };
}) {
  const [data, setData] = React.useState(() => initialData);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  // 产品类型筛选（替换原风险等级）
  // 使用 ALL 作为“全部类型”的哨兵值，避免 SelectItem 为空字符串
  const [productTypeFilter, setProductTypeFilter] = React.useState<string>("ALL");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const columns = React.useMemo(
    () =>
      getProductColumns({
        onViewDetail: (prod) => {
          setSelectedProduct(prod);
          setDetailOpen(true);
        },
        onEdit: (prod) => {
          setSelectedProduct(prod);
          setEditOpen(true);
        },
      }),
    [],
  );
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row) => row.productId,
  });

  // 更新数据当props变化时
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // 同步外部分页到表格内部分页状态
  React.useEffect(() => {
    if (pagination) {
      const safePage = Math.max(1, pagination.page);
      if (table.getState().pagination.pageIndex !== safePage - 1) {
        table.setPageIndex(safePage - 1);
      }
      if (table.getState().pagination.pageSize !== pagination.limit) {
        table.setPageSize(pagination.limit);
      }
    }
  }, [pagination?.page, pagination?.limit]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    onFilter?.({
      status: status === "all" ? undefined : status,
      productType: productTypeFilter || undefined,
    });
  };

  // 产品类型筛选输入变化
  const handleProductTypeFilter = (value: string) => {
    setProductTypeFilter(value);
    onFilter?.({
      status: statusFilter === "all" ? undefined : statusFilter,
      productType: value === "ALL" ? undefined : value,
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="text-destructive text-sm">加载客户数据时出错: {error}</div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* 工具栏：使用通用 QueryActionBar 支持自动换行 */}
      <div className="mb-6">
        <QueryActionBar
          left={
            <>
              <div className="relative max-w-sm min-w-[200px] flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="搜索产品名称..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value={ProductStatus.ACTIVE}>上架</SelectItem>
                  <SelectItem value={ProductStatus.INACTIVE}>下架</SelectItem>
                  <SelectItem value={ProductStatus.SUSPENDED}>暂停</SelectItem>
                </SelectContent>
              </Select>
              <Select value={productTypeFilter} onValueChange={handleProductTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部类型</SelectItem>
                  <SelectItem value={ProductType.WEALTH}>理财</SelectItem>
                  <SelectItem value={ProductType.FUND}>基金</SelectItem>
                  <SelectItem value={ProductType.BOND}>债券</SelectItem>
                  <SelectItem value={ProductType.INSURANCE}>保险</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => onQuery?.()}>
                <Search className="mr-2 h-4 w-4" /> 查询
              </Button>
            </>
          }
          right={
            <>
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">导入</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport?.()} disabled={exporting}>
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">{exporting ? "导出中..." : "导出"}</span>
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">新增产品</span>
              </Button>
            </>
          }
        />
      </div>

      {/* 数据表格 */}
      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew table={table} columns={columns} loading={loading} />
        </div>
        <DataTablePagination
          table={table}
          server={
            pagination
              ? {
                  page: pagination.page,
                  pageSize: pagination.limit,
                  pageCount: pagination.totalPages,
                  total: pagination.total,
                  onPageChange: pagination.onPageChange,
                  onPageSizeChange: pagination.onPageSizeChange,
                  loading,
                }
              : undefined
          }
        />
      </div>
      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          // 触发查询并刷新
          onQuery?.();
          onRefresh?.();
        }}
      />

      {/* 编辑产品 Dialog */}
      <EditProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={selectedProduct}
        onUpdated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />

      {/* 导入产品 Dialog */}
      <ImportProductDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />

      {/* 查看详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>产品详情</DialogTitle>
            <DialogDescription>查看产品的基本信息与状态。</DialogDescription>
          </DialogHeader>
          {selectedProduct ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="text-muted-foreground text-xs">产品名称</Label>
                <div className="text-sm font-medium">{selectedProduct.productName}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">产品类型</Label>
                <div className="text-sm">{selectedProduct.productType}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">风险等级</Label>
                <div className="text-sm">{selectedProduct.riskLevel}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">预期年化(%)</Label>
                <div className="text-sm">{selectedProduct.expectedReturn}%</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">投资金额区间</Label>
                <div className="text-sm">
                  {selectedProduct.minInvestment} ~ {selectedProduct.maxInvestment}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">期限(天)</Label>
                <div className="text-sm">{selectedProduct.maturityPeriod}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">结息日期</Label>
                <div className="text-sm">{selectedProduct.interestPaymentDate}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">销售期</Label>
                <div className="text-sm">
                  {selectedProduct.salesStartDate} ~ {selectedProduct.salesEndDate}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">状态</Label>
                <div className="text-sm">{selectedProduct.status}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">创建时间</Label>
                <div className="text-sm">{new Date(selectedProduct.createdAt).toLocaleString("zh-CN")}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">更新时间</Label>
                <div className="text-sm">{new Date(selectedProduct.updatedAt).toLocaleString("zh-CN")}</div>
              </div>
              {selectedProduct.description && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-xs">产品描述</Label>
                  <div className="text-sm whitespace-pre-wrap">{selectedProduct.description}</div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 保留原有的DataTable组件以防其他地方使用
export function DataTable({ data: initialData }: { data: z.infer<typeof sectionSchema>[] }) {
  const [data, setData] = React.useState(() => initialData);
  const columns = withDndColumn(dashboardColumns);
  const table = useDataTableInstance({ data, columns, getRowId: (row) => row.id.toString() });

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <Button variant="outline" size="sm">
            <Plus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      <TabsContent value="past-performance" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="focus-documents" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}
