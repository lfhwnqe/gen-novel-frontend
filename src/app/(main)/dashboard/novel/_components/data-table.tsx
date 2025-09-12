"use client";

import * as React from "react";

import { Plus, Search, Filter, Download, Upload, EllipsisVertical } from "lucide-react";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { withDndColumn } from "../../../../../components/data-table/table-utils";
import { QueryActionBar } from "@/components/layouts/query-action-bar";

import { dashboardColumns } from "./columns";
import { sectionSchema } from "./schema";
import { CreateProductDialog } from "./create-product-dialog";
import { EditWorkDialog } from "./edit-work-dialog";
import { ImportProductDialog } from "./import-product-dialog";
import { WorkStatus, type Work } from "@/types/work";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";

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
  data: any[];
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
  const fetchWithAuth = useFetchWithAuth();
  // 详情数据
  const [detail, setDetail] = React.useState<Work | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Work | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="标题" />,
        cell: ({ row }) => <div className="text-sm font-medium">{row.original.title}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
        cell: ({ row }) => {
          const status: string = row.original.status;
          const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            [WorkStatus.DRAFT]: { label: "草稿", variant: "secondary" },
            [WorkStatus.PUBLISHED]: { label: "已发布", variant: "default" },
            [WorkStatus.ARCHIVED]: { label: "已归档", variant: "outline" },
          };
          const cfg = map[status] || { label: String(status), variant: "outline" };
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
        cell: ({ row }) => {
          const v = row.original.createdAt;
          const date = v ? new Date(v) : null;
          return <div className="text-muted-foreground text-xs">{date ? date.toLocaleString("zh-CN") : "-"}</div>;
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="更新时间" />,
        cell: ({ row }) => {
          const v = row.original.updatedAt;
          const date = v ? new Date(v) : null;
          return <div className="text-muted-foreground text-xs">{date ? date.toLocaleString("zh-CN") : "-"}</div>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <EllipsisVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setDetailOpen(true) || setSelectedProduct(row.original)}>
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true) || setSelectedProduct(row.original)}>
                编辑
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        meta: { sticky: "right" },
      },
    ],
    [],
  );
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row: any) => row?.novelId || row?.id || row?.productId,
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
    });
  };

  // 打开详情时，按 novelId 拉取详情
  React.useEffect(() => {
    const id = (selectedProduct as any)?.novelId;
    if (!detailOpen || !id) return;
    let ignore = false;
    (async () => {
      try {
        setDetailLoading(true);
        const res = await fetchWithAuth(`/api/v1/novels/works/${id}`);
        if (!res.ok) throw new Error(`获取详情失败: ${res.status}`);
        const json = await res.json();
        const data = json && typeof json === "object" && "success" in json && json.success ? json.data : json;
        if (!ignore) setDetail(data as Work);
      } catch (e) {
        if (!ignore) setDetail(null);
      } finally {
        if (!ignore) setDetailLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [detailOpen, (selectedProduct as any)?.novelId]);

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
                  placeholder="搜索作品标题..."
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
                  <SelectItem value={WorkStatus.DRAFT}>草稿</SelectItem>
                  <SelectItem value={WorkStatus.PUBLISHED}>已发布</SelectItem>
                  <SelectItem value={WorkStatus.ARCHIVED}>已归档</SelectItem>
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
                <span className="hidden lg:inline">新增作品</span>
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

      {/* 编辑作品 Dialog */}
      <EditWorkDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        work={selectedProduct as any}
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

      {/* 查看作品详情 Dialog（打开时请求详情） */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>作品详情</DialogTitle>
            <DialogDescription>查看作品的基本信息与状态。</DialogDescription>
          </DialogHeader>
          {!detail || detailLoading ? (
            <div className="text-muted-foreground text-sm">{detailLoading ? "加载中..." : "无数据"}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="text-muted-foreground text-xs">标题</Label>
                <div className="text-sm font-medium">{detail.title}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">状态</Label>
                <div className="text-sm">
                  {detail.status === WorkStatus.DRAFT
                    ? "草稿"
                    : detail.status === WorkStatus.PUBLISHED
                      ? "已发布"
                      : detail.status === WorkStatus.ARCHIVED
                        ? "已归档"
                        : detail.status}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">作品ID</Label>
                <div className="text-muted-foreground font-mono text-[11px]">{detail.novelId}</div>
              </div>
              {detail.createdBy && (
                <div>
                  <Label className="text-muted-foreground text-xs">创建人</Label>
                  <div className="text-sm">{detail.createdBy}</div>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground text-xs">创建时间</Label>
                <div className="text-sm">{new Date(detail.createdAt).toLocaleString("zh-CN")}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">更新时间</Label>
                <div className="text-sm">{new Date(detail.updatedAt).toLocaleString("zh-CN")}</div>
              </div>
              {detail.description && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-xs">描述</Label>
                  <div className="text-sm whitespace-pre-wrap">{detail.description}</div>
                </div>
              )}
            </div>
          )}
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
